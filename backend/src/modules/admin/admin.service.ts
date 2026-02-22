import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../../schemas/user.schema';
import { Customer } from '../../schemas/customer.schema';
import { Transaction } from '../../schemas/transaction.schema';
import { Subscription } from '../../schemas/subscription.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    ) { }

    /**
     * List all users with their customer profile info and transaction count.
     */
    async getAllUsers() {
        const users = await this.userModel.find({ role: UserRole.USER }).select('-password').exec();

        const result = await Promise.all(
            users.map(async (user) => {
                const userId = (user._id as any).toString();

                // Find linked customer profile
                const customer = await this.customerModel
                    .findOne({ userId: user._id } as any)
                    .select('_id authorizeNetCustomerId email firstName lastName')
                    .exec();

                const transactions = await this.getUserTransactions(userId);
                const subscriptions = await this.getUserSubscriptions(userId);

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
                    transactionCount: transactions.length,
                    transactions,
                    subscriptions
                };
            }),
        );

        return result;
    }

    /**
     * Get all transactions for a specific user (one-time + CIM).
     */
    async getUserTransactions(userId: string) {
        if (!userId || userId.length !== 24) {
            throw new NotFoundException('User not found (Invalid ID format)');
        }
        const customers = await this.customerModel.find({ userId }).select('_id').lean();
        const customerIds = customers.map(c => c._id);

        return this.transactionModel.find({
            $or: [
                { userId },
                { customerId: { $in: customerIds } },
            ],
        } as any).sort({ createdAt: -1 }).exec();
    }

    /**
     * Get all subscriptions for a specific user.
     */
    async getUserSubscriptions(userId: string) {
        if (!userId || userId.length !== 24) {
            throw new NotFoundException('User not found (Invalid ID format)');
        }
        const customers = await this.customerModel.find({ userId }).select('_id').lean();
        const customerIds = customers.map(c => c._id);

        return this.subscriptionModel.find({
            customerId: { $in: customerIds }
        } as any).sort({ createdAt: -1 }).exec();
    }

    /**
     * Get comprehensive details for a specific user (Info, Customer, TXs, Subscriptions).
     */
    async getUserDetails(userId: string) {
        if (!userId || userId.length !== 24) {
            throw new NotFoundException('User not found (Invalid ID format)');
        }

        const user = await this.userModel.findById(userId).select('-password').exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const customer = await this.customerModel.findOne({ userId: user._id } as any).exec();
        const transactions = await this.getUserTransactions(userId);
        const subscriptions = await this.getUserSubscriptions(userId);

        return {
            user: {
                _id: user._id,
                email: user.email,
                role: (user as any).role,
            },
            customer: customer ? {
                _id: (customer as any)._id,
                authorizeNetCustomerId: customer.authorizeNetCustomerId,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
            } : null,
            transactions,
            subscriptions
        };
    }
}
