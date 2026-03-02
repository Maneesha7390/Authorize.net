import { WebhookEvent } from "./webhook-event.model";
import { Transaction, TransactionStatus, TransactionType } from "../subscriptions/transaction.model";
import { Subscription, SubscriptionStatus } from "../subscriptions/subscription.model";

export class WebhooksService {
    static async handleEvent(payload: any): Promise<void> {
        const eventId = payload.notificationId;
        const eventType = payload.eventType;

        console.log(`Received Authorize.Net Webhook: ${eventType} (ID: ${eventId})`);

        // 1. Idempotency Check
        const existing = await WebhookEvent.findOne({ eventId });
        if (existing) {
            console.warn(`Event ${eventId} already processed`);
            return;
        }

        // 2. Save Event
        const event = await WebhookEvent.create({
            eventId,
            eventType,
            payload,
        });

        // 3. Process Event
        try {
            switch (eventType) {
                case "net.authorize.payment.authcapture.created":
                case "net.authorize.payment.authorization.created":
                case "net.authorize.payment.capture.created":
                case "net.authorize.payment.priorAuthCapture.created":
                    await this.handlePaymentCreated(payload);
                    break;
                case "net.authorize.payment.settlement.successfully":
                    await this.handleSettlementSuccessfully(payload);
                    break;
                case "net.authorize.customer.subscription.cancelled":
                    await this.handleSubscriptionCancelled(payload);
                    break;
                case "net.authorize.customer.subscription.suspended":
                    await this.handleSubscriptionSuspended(payload);
                    break;
            }

            event.processed = true;
            event.processedAt = new Date();
            await event.save();
        } catch (error: any) {
            console.error(`Error processing event ${eventId}: ${error.message}`);
            event.error = error.message;
            await event.save();
        }
    }

    private static async handlePaymentCreated(payload: any) {
        const eventType = payload.eventType;
        const transId = payload.payload.id;
        const amount = payload.payload.authAmount || payload.payload.amount;
        const refId = payload.payload.refId || payload.payload.merchantReferenceId;
        const subId = payload.payload.subscriptionId;

        // 1. Find by refId (mongoId) or authorizeNetTransactionId
        let tx = null;
        if (refId && refId.length === 24) {
            tx = await Transaction.findById(refId);
        }

        if (!tx) {
            tx = await Transaction.findOne({ authorizeNetTransactionId: transId });
        }

        let type = TransactionType.CHARGE;
        if (eventType.includes("authorization")) type = TransactionType.AUTHORIZE;
        else if (eventType.includes("capture.created") || eventType.includes("priorAuthCapture"))
            type = TransactionType.CAPTURE;

        if (!tx) {
            // Find subscription to link
            const sub = subId ? await Subscription.findOne({ authorizeNetSubscriptionId: subId }) : null;

            await Transaction.create({
                authorizeNetTransactionId: transId,
                amount,
                type,
                status: TransactionStatus.SUCCESS,
                customerId: sub ? sub.customerId : undefined,
                subscriptionId: sub ? sub._id : undefined,
                rawResponse: payload,
            });
        } else {
            tx.authorizeNetTransactionId = transId;
            tx.status = TransactionStatus.SUCCESS;
            tx.type = type;
            tx.rawResponse = payload;
            await tx.save();
        }
    }

    private static async handleSubscriptionCancelled(payload: any) {
        const subId = payload.payload.id;
        await Subscription.findOneAndUpdate(
            { authorizeNetSubscriptionId: subId },
            { status: SubscriptionStatus.CANCELED }
        );
    }

    private static async handleSubscriptionSuspended(payload: any) {
        const subId = payload.payload.id;
        await Subscription.findOneAndUpdate(
            { authorizeNetSubscriptionId: subId },
            { status: SubscriptionStatus.SUSPENDED }
        );
    }

    private static async handleSettlementSuccessfully(payload: any) {
        const transIds = payload.payload.transactionIds || [payload.payload.id];
        if (transIds && Array.isArray(transIds)) {
            await Transaction.updateMany(
                { authorizeNetTransactionId: { $in: transIds } },
                { status: TransactionStatus.SETTLED }
            );
        }
    }
}
