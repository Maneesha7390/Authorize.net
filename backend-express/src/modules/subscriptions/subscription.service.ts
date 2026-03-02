import { Subscription, SubscriptionStatus } from "./subscription.model";
import { Customer } from "../customers/customer.model";
import { PaymentProfile } from "../customers/payment-profile.model";
import { Plan } from "../plans/plan.model";
import { Transaction, TransactionStatus, TransactionType } from "./transaction.model";
import { authNetService } from "../../common/AuthorizeNetService";
import { ApiError } from "../../utils/ApiError";

export class SubscriptionsService {
    static async create(dto: any) {
        const customer = await Customer.findById(dto.customerId);
        const paymentProfile = await PaymentProfile.findById(dto.paymentProfileId);
        const plan = await Plan.findById(dto.planId);

        if (!customer || !paymentProfile || !plan) {
            throw new ApiError(404, "Customer, Payment Profile, or Plan not found");
        }

        // 1. Create ARB Subscription in Authorize.Net
        let authNetSubscriptionId: string;
        try {
            authNetSubscriptionId = await authNetService.createSubscription(
                customer.authorizeNetCustomerId,
                paymentProfile.authorizeNetPaymentProfileId,
                {
                    name: dto.planName || plan.name,
                    amount: dto.amount || plan.amount,
                    intervalLength: dto.intervalLength || plan.intervalLength,
                    intervalUnit: dto.intervalUnit || plan.intervalUnit,
                    startDate: dto.startDate || new Date().toISOString().split("T")[0],
                    totalOccurrences: dto.totalOccurrences || plan.totalOccurrences,
                    trialAmount: dto.trialAmount !== undefined ? dto.trialAmount : plan.trialAmount,
                    trialOccurrences: dto.trialOccurrences !== undefined ? dto.trialOccurrences : plan.trialOccurrences,
                }
            );
        } catch (error: any) {
            throw new ApiError(400, `Authorize.net Error: ${error.message}`);
        }

        // 2. Save in MongoDB
        const subscription = await Subscription.create({
            ...dto,
            planName: dto.planName || plan.name,
            amount: dto.amount || plan.amount,
            intervalLength: dto.intervalLength || plan.intervalLength,
            intervalUnit: dto.intervalUnit || plan.intervalUnit,
            totalOccurrences: dto.totalOccurrences || plan.totalOccurrences,
            trialAmount: dto.trialAmount !== undefined ? dto.trialAmount : plan.trialAmount,
            trialOccurrences: dto.trialOccurrences !== undefined ? dto.trialOccurrences : plan.trialOccurrences,
            authorizeNetSubscriptionId: authNetSubscriptionId,
            status: SubscriptionStatus.ACTIVE,
        });

        return subscription;
    }

    static async cancel(id: string, user: any) {
        const subscription = await Subscription.findById(id);
        if (!subscription) throw new ApiError(404, "Subscription not found");

        // Ownership check
        if (user.role !== "admin") {
            const customer = await Customer.findById(subscription.customerId);
            if (!customer || customer.userId.toString() !== user._id.toString()) {
                throw new ApiError(403, "Access denied: Not your subscription");
            }
        }

        try {
            await authNetService.cancelSubscription(subscription.authorizeNetSubscriptionId);
        } catch (error: any) {
            throw new ApiError(400, `Failed to cancel: ${error.message}`);
        }

        subscription.status = SubscriptionStatus.CANCELED;
        return await subscription.save();
    }

    static async getStatus(id: string) {
        const subscription = await Subscription.findById(id);
        if (!subscription) throw new ApiError(404, "Subscription not found");

        try {
            const status = await authNetService.getSubscriptionStatus(subscription.authorizeNetSubscriptionId);

            // Sync local status if canceled
            if (status.toLowerCase().includes("cancel")) {
                subscription.status = SubscriptionStatus.CANCELED;
                await subscription.save();
            }

            return status;
        } catch (error: any) {
            throw new ApiError(400, `Failed to get status: ${error.message}`);
        }
    }

    static async findByUser(userId: string) {
        const customers = await Customer.find({ userId }).select("_id");
        const customerIds = customers.map((c) => c._id);

        return await Subscription.find({
            customerId: { $in: customerIds },
        }).sort({ createdAt: -1 });
    }

    static async findByCustomer(customerId: string, user: any) {
        const customer = await Customer.findById(customerId);
        if (!customer) throw new ApiError(404, "Customer not found");

        if (user.role !== "admin" && customer.userId.toString() !== user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }

        return await Subscription.find({ customerId }).sort({ createdAt: -1 });
    }

    static async pause(id: string, user: any) {
        const subscription = await Subscription.findById(id);
        if (!subscription) throw new ApiError(404, "Subscription not found");

        if (user.role !== "admin") {
            const customer = await Customer.findById(subscription.customerId);
            if (!customer || customer.userId.toString() !== user._id.toString()) {
                throw new ApiError(403, "Access denied");
            }
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new ApiError(400, "Only active subscriptions can be paused");
        }

        try {
            const authNetSub = await authNetService.getSubscription(subscription.authorizeNetSubscriptionId);
            const pastOccurrences = authNetSub.getPastOccurrences();

            await authNetService.updateSubscription(subscription.authorizeNetSubscriptionId, {
                totalOccurrences: pastOccurrences,
            });

            subscription.status = SubscriptionStatus.SUSPENDED;
            return await subscription.save();
        } catch (error: any) {
            throw new ApiError(400, `Pause failed: ${error.message}`);
        }
    }

    static async resume(id: string, user: any) {
        const subscription = await Subscription.findById(id);
        if (!subscription) throw new ApiError(404, "Subscription not found");

        if (user.role !== "admin") {
            const customer = await Customer.findById(subscription.customerId);
            if (!customer || customer.userId.toString() !== user._id.toString()) {
                throw new ApiError(403, "Access denied");
            }
        }

        if (subscription.status !== SubscriptionStatus.SUSPENDED) {
            throw new ApiError(400, "Only suspended subscriptions can be resumed");
        }

        try {
            const originalOccurrences = subscription.totalOccurrences || 9999;
            await authNetService.updateSubscription(subscription.authorizeNetSubscriptionId, {
                totalOccurrences: originalOccurrences,
            });

            subscription.status = SubscriptionStatus.ACTIVE;
            return await subscription.save();
        } catch (error: any) {
            throw new ApiError(400, `Resume failed: ${error.message}`);
        }
    }

    static async upgrade(id: string, dto: any, user: any) {
        const subscription = await Subscription.findById(id);
        if (!subscription) throw new ApiError(404, "Subscription not found");

        if (user.role !== "admin") {
            const customer = await Customer.findById(subscription.customerId);
            if (!customer || customer.userId.toString() !== user._id.toString()) {
                throw new ApiError(403, "Access denied");
            }
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new ApiError(400, "Only active subscriptions can be upgraded");
        }

        const newPlan = await Plan.findById(dto.newPlanId);
        if (!newPlan) throw new ApiError(404, "New plan not found");

        const customer = await Customer.findById(subscription.customerId);
        const paymentProfile = await PaymentProfile.findById(subscription.paymentProfileId);

        if (!customer || !paymentProfile) throw new ApiError(404, "Context data missing");

        // Proration Logic
        const now = new Date();
        const startDate = subscription.startDate || (subscription as any).createdAt;
        const diffTime = Math.abs(now.getTime() - new Date(startDate).getTime());

        const currentUnit = (subscription.intervalUnit || "months").toLowerCase();
        const daysInInterval = currentUnit === "years" ? 365 : 30;
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % daysInInterval;
        const daysRemaining = daysInInterval - daysPassed;

        const credit = (daysRemaining / daysInInterval) * subscription.amount;
        const newAmount = dto.newAmount || newPlan.amount;
        const immediateCharge = parseFloat(Math.max(0, newAmount - credit).toFixed(2));

        let txDetails = null;

        if (immediateCharge > 0.50) {
            try {
                const response = await authNetService.chargeCustomerProfile(
                    customer.authorizeNetCustomerId,
                    paymentProfile.authorizeNetPaymentProfileId,
                    immediateCharge
                );

                const tx = await Transaction.create({
                    userId: user._id,
                    customerId: customer._id,
                    subscriptionId: subscription._id,
                    authorizeNetTransactionId: response.transId,
                    amount: immediateCharge,
                    type: TransactionType.CHARGE,
                    status: TransactionStatus.SUCCESS,
                    responseText: "Upgrade Proration Charge",
                });

                txDetails = tx;
            } catch (error: any) {
                throw new ApiError(400, `Proration charge failed: ${error.message}`);
            }
        }

        try {
            // For ARB, if interval changes, we must cancel and re-create
            const intervalChanged = subscription.intervalLength !== newPlan.intervalLength ||
                subscription.intervalUnit !== newPlan.intervalUnit;

            if (intervalChanged) {
                await authNetService.cancelSubscription(subscription.authorizeNetSubscriptionId);

                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                const newAuthId = await authNetService.createSubscription(
                    customer.authorizeNetCustomerId,
                    paymentProfile.authorizeNetPaymentProfileId,
                    {
                        name: newPlan.name,
                        amount: newAmount,
                        intervalLength: newPlan.intervalLength,
                        intervalUnit: newPlan.intervalUnit,
                        startDate: tomorrow.toISOString().split("T")[0],
                        totalOccurrences: newPlan.totalOccurrences || 9999
                    }
                );
                subscription.authorizeNetSubscriptionId = newAuthId;
            } else {
                await authNetService.updateSubscription(subscription.authorizeNetSubscriptionId, {
                    name: newPlan.name,
                    amount: newAmount
                });
            }

            subscription.planId = newPlan._id as any;
            subscription.planName = newPlan.name;
            subscription.amount = newAmount;
            subscription.intervalLength = newPlan.intervalLength;
            subscription.intervalUnit = newPlan.intervalUnit;
            await subscription.save();

            return {
                subscription,
                transaction: txDetails,
                message: "Subscription upgraded successfully"
            };
        } catch (error: any) {
            throw new ApiError(400, `Gateway update failed: ${error.message}`);
        }
    }
}
