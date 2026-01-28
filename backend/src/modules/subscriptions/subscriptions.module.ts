import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { PaymentProfile, PaymentProfileSchema } from '../../schemas/payment-profile.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Customer.name, schema: CustomerSchema },
            { name: PaymentProfile.name, schema: PaymentProfileSchema },
        ]),
    ],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, AuthorizeNetService],
})
export class SubscriptionsModule { }
