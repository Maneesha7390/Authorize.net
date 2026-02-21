import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { PaymentProfile, PaymentProfileSchema } from '../../schemas/payment-profile.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Customer.name, schema: CustomerSchema },
            { name: PaymentProfile.name, schema: PaymentProfileSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [CustomersController],
    providers: [CustomersService, AuthorizeNetService],
    exports: [CustomersService],
})
export class CustomersModule { }
