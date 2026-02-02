import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { PaymentProfile, PaymentProfileSchema } from '../../schemas/payment-profile.schema';
import { Plan, PlanSchema } from '../../schemas/plan.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Customer.name, schema: CustomerSchema },
            { name: PaymentProfile.name, schema: PaymentProfileSchema },
            { name: Plan.name, schema: PlanSchema },
            { name: Transaction.name, schema: TransactionSchema },
        ]),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, AuthorizeNetService],
})
export class SubscriptionsModule { }
