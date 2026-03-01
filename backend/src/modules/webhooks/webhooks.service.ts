import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookEvent } from '../../schemas/webhook-event.schema';
import { Transaction, TransactionStatus, TransactionType } from '../../schemas/transaction.schema';
import { Subscription, SubscriptionStatus } from '../../schemas/subscription.schema';

@Injectable()
export class WebhooksService {
    private readonly logger = new Logger(WebhooksService.name);

    constructor(
        @InjectModel(WebhookEvent.name) private eventModel: Model<WebhookEvent>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    ) { }

    async handleEvent(payload: any): Promise<void> {
        const eventId = payload.notificationId;
        const eventType = payload.eventType;

        this.logger.log(`Received Authorize.Net Webhook: ${eventType} (ID: ${eventId})`);
        this.logger.log(`Full Webhook Payload: ${JSON.stringify(payload)}`);

        // 1. Idempotency Check
        const existing = await this.eventModel.findOne({ eventId });
        if (existing) {
            this.logger.warn(`Event ${eventId} already processed`);
            return;
        }

        // 2. Save Event
        const event = new this.eventModel({
            eventId,
            eventType,
            payload,
        });
        await event.save();

        // 3. Process Event
        try {
            switch (eventType) {
                case 'net.authorize.payment.authcapture.created':
                case 'net.authorize.payment.authorization.created':
                case 'net.authorize.payment.capture.created':
                case 'net.authorize.payment.priorAuthCapture.created':
                    await this.handlePaymentCreated(payload);
                    break;
                case 'net.authorize.payment.settlement.successfully':
                    await this.handleSettlementSuccessfully(payload);
                    break;
                case 'net.authorize.customer.subscription.cancelled':
                    await this.handleSubscriptionCancelled(payload);
                    break;
                case 'net.authorize.customer.subscription.suspended':
                    await this.handleSubscriptionSuspended(payload);
                    break;
                // Add more cases as needed
            }

            event.processed = true;
            event.processedAt = new Date();
            await event.save();
        } catch (error) {
            this.logger.error(`Error processing event ${eventId}: ${error.message}`);
            event.error = error.message;
            await event.save();
        }
    }

    private async handlePaymentCreated(payload: any) {
        const eventType = payload.eventType;
        const transId = payload.payload.id;
        const amount = payload.payload.authAmount || payload.payload.amount; // Use authAmount or amount
        const refId = payload.payload.refId || payload.payload.merchantReferenceId;
        const subscriptionId = payload.payload.subscriptionId;

        this.logger.log(`Received ${eventType} for TransId: ${transId}, RefId: ${refId}`);

        // 1. Try to find the transaction by refId (best for Hosted Payments)
        let tx = null;
        if (refId && refId.length === 24) {
            tx = await this.transactionModel.findById(refId);
        }

        // 2. Otherwise try by authorizeNetTransactionId
        if (!tx) {
            tx = await this.transactionModel.findOne({ authorizeNetTransactionId: transId });
        }

        // Determine transaction type based on event
        let type = TransactionType.CHARGE;
        if (eventType.includes('authorization')) {
            type = TransactionType.AUTHORIZE;
        } else if (eventType.includes('priorAuthCapture') || eventType.includes('capture.created')) {
            type = TransactionType.CAPTURE;
        }

        if (!tx) {
            this.logger.warn(`Transaction not found for RefId: ${refId} or TransId: ${transId}. Full Payload: ${JSON.stringify(payload.payload)}`);
            // Find the subscription to link it back to the customer
            const sub = subscriptionId ? await this.subscriptionModel.findOne({ authorizeNetSubscriptionId: subscriptionId }) : null;

            tx = new this.transactionModel({
                userId: null, // We don't have the userId here if tx wasn't found by refId
                authorizeNetTransactionId: transId,
                amount: amount,
                type: type,
                status: TransactionStatus.SUCCESS,
                customerId: sub ? sub.customerId : null,
                subscriptionId: sub ? sub._id : null,
                rawResponse: payload
            });
            this.logger.log(`Created new transaction record for ${transId} (Type: ${type}, SubId: ${subscriptionId})`);
        } else {
            // Update the existing PENDING transaction
            tx.authorizeNetTransactionId = transId;
            tx.status = TransactionStatus.SUCCESS;
            tx.type = type; // Update type as well just in case
            tx.rawResponse = payload;
            this.logger.log(`Updated existing transaction ${tx._id} (AuthId: ${transId}, Status: SUCCESS)`);
        }

        await tx.save();
    }

    private async handleSubscriptionCancelled(payload: any) {
        const subId = payload.payload.id;
        const sub = await this.subscriptionModel.findOne({ authorizeNetSubscriptionId: subId });
        if (sub) {
            sub.status = SubscriptionStatus.CANCELED;
            await sub.save();
        }
    }

    private async handleSubscriptionSuspended(payload: any) {
        const subId = payload.payload.id;
        const sub = await this.subscriptionModel.findOne({ authorizeNetSubscriptionId: subId });
        if (sub) {
            sub.status = SubscriptionStatus.SUSPENDED;
            await sub.save();
        }
    }

    private async handleSettlementSuccessfully(payload: any) {
        // Authorize.Net settlement payload contains an array of transaction IDs
        // or a single transaction ID depending on the specific event structure.
        const transIds = payload.payload.transactionIds || [payload.payload.id];

        if (transIds && Array.isArray(transIds)) {
            for (const transId of transIds) {
                const tx = await this.transactionModel.findOne({ authorizeNetTransactionId: transId });
                if (tx) {
                    tx.status = TransactionStatus.SETTLED;
                    await tx.save();
                    this.logger.log(`Transaction ${transId} marked as SETTLED via webhook`);
                }
            }
        }
    }
}
