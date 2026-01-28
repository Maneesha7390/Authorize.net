import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookEvent } from '../../schemas/webhook-event.schema';
import { Transaction, TransactionStatus } from '../../schemas/transaction.schema';
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
                case 'net.authorize.payment.capture.created':
                    await this.handlePaymentCreated(payload);
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
        const transId = payload.payload.id;
        const tx = await this.transactionModel.findOne({ authorizeNetTransactionId: transId });
        if (tx) {
            tx.status = TransactionStatus.SUCCESS;
            await tx.save();
        }
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
}
