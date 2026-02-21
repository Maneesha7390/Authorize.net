import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';
import { Customer } from '../../schemas/customer.schema';
import { Transaction } from '../../schemas/transaction.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    ) { }

    /**
     * List all users with their customer profile info and transaction count.
     */
    async getAllUsers() {
        const users = await this.userModel.find().select('-password').exec();

        const result = await Promise.all(
            users.map(async (user) => {
                const userId = (user._id as any).toString();

                // Find linked customer profile
                const customer = await this.customerModel
                    .findOne({ userId: user._id } as any)
                    .select('_id authorizeNetCustomerId email firstName lastName')
                    .exec();

                // Count all transactions for this user (one-time + CIM)
                const customerIds: any[] = customer ? [(customer as any)._id] : [];

                const transactionCount = await this.transactionModel.countDocuments({
                    $or: [
                        { userId },
                        { customerId: { $in: customerIds } },
                    ],
                } as any);

                return {
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: (user as any).role,
                    },
                    customer: customer
                        ? {
                            _id: (customer as any)._id,
                            authorizeNetCustomerId: customer.authorizeNetCustomerId,
                            email: customer.email,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                        }
                        : null,
                    transactionCount,
                };
            }),
        );

        return result;
    }

    /**
     * Get all transactions for a specific user (one-time + CIM).
     */
    async getUserTransactions(userId: string) {
        const customers = await this.customerModel.find({ userId }).select('_id').lean();
        const customerIds = customers.map(c => c._id);

        return this.transactionModel.find({
            $or: [
                { userId },
                { customerId: { $in: customerIds } },
            ],
        } as any).sort({ createdAt: -1 }).exec();
    }
}
