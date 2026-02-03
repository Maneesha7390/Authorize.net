import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionStatus } from '../../schemas/subscription.schema';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { Plan } from '../../schemas/plan.schema';
import { Transaction, TransactionStatus, TransactionType } from '../../schemas/transaction.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { CreateSubscriptionDto, UpgradeSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        @InjectModel(Plan.name) private planModel: Model<Plan>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        private authNetService: AuthorizeNetService,
    ) { }

    async create(dto: CreateSubscriptionDto): Promise<Subscription> {
        const customer = await this.customerModel.findById(dto.customerId);
        const paymentProfile = await this.paymentProfileModel.findById(dto.paymentProfileId);
        const plan = await this.planModel.findById(dto.planId);

        if (!customer || !paymentProfile || !plan) {
            throw new NotFoundException('Customer, Payment Profile, or Plan not found');
        }

        // 1. Create ARB Subscription in Authorize.Net using Plan details (override with DTO if provided)
        try {
            const authNetSubscriptionId = await this.authNetService.createSubscription(
                customer.authorizeNetCustomerId,
                paymentProfile.authorizeNetPaymentProfileId,
                {
                    name: dto.planName || plan.name,
                    amount: dto.amount || plan.amount,
                    intervalLength: dto.intervalLength || plan.intervalLength,
                    intervalUnit: dto.intervalUnit || plan.intervalUnit,
                    startDate: dto.startDate || new Date().toISOString().split('T')[0],
                    totalOccurrences: dto.totalOccurrences || plan.totalOccurrences,
                    trialAmount: dto.trialAmount !== undefined ? dto.trialAmount : plan.trialAmount,
                    trialOccurrences: dto.trialOccurrences !== undefined ? dto.trialOccurrences : plan.trialOccurrences,
                },
            );

            // 2. Save in MongoDB
            const subscription = new this.subscriptionModel({
                ...dto,
                planName: dto.planName || plan.name,
                amount: dto.amount || plan.amount,
                intervalLength: dto.intervalLength || plan.intervalLength,
                intervalUnit: dto.intervalUnit || plan.intervalUnit,
                totalOccurrences: dto.totalOccurrences || plan.totalOccurrences,
                trialAmount: dto.trialAmount !== undefined ? dto.trialAmount : plan.trialAmount,
                trialOccurrences: dto.trialOccurrences !== undefined ? dto.trialOccurrences : plan.trialOccurrences,
                paymentProfileId: dto.paymentProfileId, // Added this
                authorizeNetSubscriptionId: authNetSubscriptionId,
                status: SubscriptionStatus.ACTIVE,
            });

            return subscription.save();
        } catch (error) {
            throw new NotFoundException(`Failed to create subscription: ${error.message}`);
        }
    }

    async cancel(id: string, user: any): Promise<Subscription> {
        const subscription = await this.subscriptionModel.findById(id);
        if (!subscription) throw new NotFoundException('Subscription not found');

        // Ownership check
        if (user.role !== 'admin') {
            const customer = await this.customerModel.findById(subscription.customerId);
            if (!customer || customer.userId?.toString() !== user.userId?.toString()) {
                throw new ForbiddenException('You do not have permission to cancel this subscription');
            }
        }

        await this.authNetService.cancelSubscription(subscription.authorizeNetSubscriptionId);

        subscription.status = SubscriptionStatus.CANCELED;
        return subscription.save();
    }

    async getStatus(id: string): Promise<string> {
        const subscription = await this.subscriptionModel.findById(id);
        if (!subscription) throw new NotFoundException('Subscription not found');

        const status = await this.authNetService.getSubscriptionStatus(subscription.authorizeNetSubscriptionId);

        // Update local status if needed
        if (status.toLowerCase().includes('cancel')) {
            subscription.status = SubscriptionStatus.CANCELED;
            await subscription.save();
        }

        return status;
    }

    async upgrade(id: string, dto: UpgradeSubscriptionDto, user: any): Promise<any> {
        const subscription = await this.subscriptionModel.findById(id);
        if (!subscription) throw new NotFoundException('Subscription not found');

        // Detailed Ownership check
        if (user.role !== 'admin') {
            const customer = await this.customerModel.findById(subscription.customerId);
            if (!customer) {
                throw new NotFoundException('The customer for this subscription was not found');
            }
            if (customer.userId?.toString() !== user.userId?.toString()) {
                throw new ForbiddenException('Access denied: You do not have permission to upgrade this subscription');
            }
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new ForbiddenException(`Only ACTIVE subscriptions can be upgraded. Current status: ${subscription.status}`);
        }

        const newPlan = await this.planModel.findById(dto.newPlanId);
        if (!newPlan) throw new NotFoundException('New Plan not found');

        const customer = await this.customerModel.findById(subscription.customerId);
        const paymentProfile = await this.paymentProfileModel.findById(subscription.paymentProfileId);

        // 1. Calculate Proration
        const now = new Date();
        const startOfCycle = subscription.startDate || (subscription as any).createdAt;
        const diffTime = Math.abs(now.getTime() - new Date(startOfCycle).getTime());

        // Determine days in current and new intervals (robust comparison)
        const currentUnit = (subscription.intervalUnit || 'months').toLowerCase().trim();
        const newUnit = (newPlan.intervalUnit || 'months').toLowerCase().trim();

        const daysInCurrentInterval = currentUnit === 'years' || currentUnit === 'year' ? 365 : 30;
        const daysInNewInterval = newUnit === 'years' || newUnit === 'year' ? 365 : 30;

        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) % daysInCurrentInterval;
        const daysRemaining = daysInCurrentInterval - daysPassed;

        const credit = (daysRemaining / daysInCurrentInterval) * subscription.amount;

        // If interval changed, we expect to charge the full new plan price minus credit
        const intervalChanged = subscription.intervalLength !== newPlan.intervalLength || currentUnit !== newUnit;

        const newCost = intervalChanged ? (dto.newAmount || newPlan.amount) : (daysRemaining / daysInNewInterval) * (dto.newAmount || newPlan.amount);
        const immediateChargeAmount = parseFloat(Math.max(0, newCost - credit).toFixed(2));

        let immediateCharge = null;

        // 2. Charge the difference immediately (One-time charge)
        if (immediateChargeAmount > 0.50) {
            try {
                const response = await this.authNetService.chargeCustomerProfile(
                    customer.authorizeNetCustomerId,
                    paymentProfile.authorizeNetPaymentProfileId,
                    immediateChargeAmount
                );

                // Record the transaction
                const transaction = new this.transactionModel({
                    customerId: customer._id,
                    subscriptionId: subscription._id,
                    authorizeNetTransactionId: response.transId,
                    amount: immediateChargeAmount,
                    type: TransactionType.CHARGE,
                    status: TransactionStatus.SUCCESS,
                    responseText: 'Upgrade Proration Charge',
                    rawResponse: response,
                });
                const savedTx = await transaction.save();
                immediateCharge = {
                    amount: immediateChargeAmount,
                    transactionId: savedTx._id,
                    authorizeNetTransactionId: response.transId
                };
            } catch (error) {
                throw new ForbiddenException(`Immediate proration charge failed: ${error.message}`);
            }
        }

        // 3. Update or Re-create the ARB Subscription for future cycles
        try {
            // AUTHORIZE.NET LIMITATION: You cannot change the interval (unit/length) of an active subscription.
            // If the interval changed, we must cancel and re-create.
            if (intervalChanged) {
                // Cancel old
                await this.authNetService.cancelSubscription(subscription.authorizeNetSubscriptionId);

                // Create new starting tomorrow (to avoid same-day collisions)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);

                const newAuthNetId = await this.authNetService.createSubscription(
                    customer.authorizeNetCustomerId,
                    paymentProfile.authorizeNetPaymentProfileId,
                    {
                        name: newPlan.name,
                        amount: dto.newAmount || newPlan.amount,
                        intervalLength: newPlan.intervalLength,
                        intervalUnit: newPlan.intervalUnit,
                        startDate: tomorrow.toISOString().split('T')[0],
                        totalOccurrences: newPlan.totalOccurrences || 9999,
                    }
                );
                subscription.authorizeNetSubscriptionId = newAuthNetId;
            } else {
                // Same interval, just update amount
                await this.authNetService.updateSubscription(
                    subscription.authorizeNetSubscriptionId,
                    {
                        name: newPlan.name,
                        amount: dto.newAmount || newPlan.amount,
                    }
                );
            }

            // 4. Update local DB
            subscription.planId = newPlan.id;
            subscription.planName = newPlan.name;
            subscription.amount = dto.newAmount || newPlan.amount;
            subscription.intervalLength = newPlan.intervalLength;
            subscription.intervalUnit = newPlan.intervalUnit;
            await subscription.save();

            return {
                message: intervalChanged
                    ? 'Subscription upgraded (new cycle created due to interval change)'
                    : 'Subscription updated successfully',
                proration: {
                    daysRemaining,
                    creditAvailable: parseFloat(credit.toFixed(2)),
                    newCostForPeriod: parseFloat(newCost.toFixed(2)),
                    immediateChargeAmount
                },
                subscription,
                immediateCharge
            };
        } catch (error) {
            throw new ForbiddenException(`Failed to synchronize with payment gateway: ${error.message}`);
        }
    }

    async findByUser(userId: string): Promise<Subscription[]> {
        const customers = await this.customerModel.find({ userId }).select('_id');
        const customerIds = customers.map(c => c._id.toString());

        return this.subscriptionModel.find({
            customerId: { $in: customerIds }
        } as any).sort({ createdAt: -1 }).exec();
    }

    async findByCustomer(customerId: string, user: any): Promise<Subscription[]> {
        const customer = await this.customerModel.findById(customerId);
        if (!customer) throw new NotFoundException('Customer not found');

        // Ownership check
        if (user.role !== 'admin' && customer.userId?.toString() !== user.userId?.toString()) {
            throw new ForbiddenException('You do not have permission to view subscriptions for this customer');
        }

        return this.subscriptionModel.find({ customerId } as any)
            .sort({ createdAt: -1 })
            .exec();
    }
}
