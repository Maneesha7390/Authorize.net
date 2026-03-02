import { User, UserRole } from "../auth/auth.model";
import { Customer } from "../customers/customer.model";
import { Transaction } from "../subscriptions/transaction.model";
import { Subscription } from "../subscriptions/subscription.model";
import { ApiError } from "../../utils/ApiError";

export class AdminService {
    /**
     * List all users with their customer profile info and transaction stats.
     */
    static async getAllUsers() {
        const users = await User.find({ role: UserRole.USER }).select("-password");

        const result = await Promise.all(
            users.map(async (user) => {
                const userId = user._id.toString();

                // Find linked customer profile
                const customer = await Customer.findOne({ userId: user._id }).select(
                    "_id authorizeNetCustomerId email firstName lastName"
                );

                const transactions = await this.getUserTransactions(userId);
                const subscriptions = await this.getUserSubscriptions(userId);

                return {
                    user: {
                        _id: user._id,
                        email: user.email,
                        role: user.role,
                    },
                    customer: customer
                        ? {
                            _id: customer._id,
                            authorizeNetCustomerId: customer.authorizeNetCustomerId,
                            email: customer.email,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                        }
                        : null,
                    transactionCount: transactions.length,
                    transactions,
                    subscriptions,
                };
            })
        );

        return result;
    }

    /**
     * Get all transactions for a specific user (one-time + CIM).
     */
    static async getUserTransactions(userId: string) {
        const customers = await Customer.find({ userId }).select("_id");
        const customerIds = customers.map((c) => c._id);

        return await Transaction.find({
            $or: [{ userId }, { customerId: { $in: customerIds } }],
        }).sort({ createdAt: -1 });
    }

    /**
     * Get all subscriptions for a specific user.
     */
    static async getUserSubscriptions(userId: string) {
        const customers = await Customer.find({ userId }).select("_id");
        const customerIds = customers.map((c) => c._id);

        return await Subscription.find({
            customerId: { $in: customerIds },
        }).sort({ createdAt: -1 });
    }

    /**
     * Get comprehensive details for a specific user.
     */
    static async getUserDetails(userId: string) {
        const user = await User.findById(userId).select("-password");
        if (!user) throw new ApiError(404, "User not found");

        const customer = await Customer.findOne({ userId: user._id });
        const transactions = await this.getUserTransactions(userId);
        const subscriptions = await this.getUserSubscriptions(userId);

        return {
            user: {
                _id: user._id,
                email: user.email,
                role: user.role,
            },
            customer: customer
                ? {
                    _id: customer._id,
                    authorizeNetCustomerId: customer.authorizeNetCustomerId,
                    email: customer.email,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                }
                : null,
            transactions,
            subscriptions,
        };
    }
}
