import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../../schemas/user.schema';
import { Customer, CustomerSchema } from '../../schemas/customer.schema';
import { Transaction, TransactionSchema } from '../../schemas/transaction.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Customer.name, schema: CustomerSchema },
            { name: Transaction.name, schema: TransactionSchema },
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule { }
