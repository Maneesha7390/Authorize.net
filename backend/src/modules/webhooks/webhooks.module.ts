import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookEvent, WebhookEventSchema } from '../../schemas/webhook-event.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: WebhookEvent.name, schema: WebhookEventSchema },
            { name: Transaction.name, schema: TransactionSchema },
            { name: Subscription.name, schema: SubscriptionSchema },
        ]),
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService],
})
export class WebhooksModule { }
