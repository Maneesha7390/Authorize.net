import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';
import { Refund, RefundSchema } from '../../schemas/refund.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { PaymentProfile, PaymentProfileSchema } from '../../schemas/payment-profile.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Transaction.name, schema: TransactionSchema },
            { name: Refund.name, schema: RefundSchema },
            { name: Customer.name, schema: CustomerSchema },
            { name: PaymentProfile.name, schema: PaymentProfileSchema },
            { name: Subscription.name, schema: SubscriptionSchema },
        ]),
    ],
    controllers: [PaymentsController],
    providers: [PaymentsService, AuthorizeNetService],
})
export class PaymentsModule { }
