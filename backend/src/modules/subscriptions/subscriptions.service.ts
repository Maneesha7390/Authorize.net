import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionStatus } from '../../schemas/subscription.schema';
import { Customer } from '../../schemas/customer.schema';
import { PaymentProfile } from '../../schemas/payment-profile.schema';
import { AuthorizeNetService } from '../../common/authorize-net.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
    constructor(
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
        @InjectModel(Customer.name) private customerModel: Model<Customer>,
        @InjectModel(PaymentProfile.name) private paymentProfileModel: Model<PaymentProfile>,
        private authNetService: AuthorizeNetService,
    ) { }

    async create(dto: CreateSubscriptionDto): Promise<Subscription> {
        const customer = await this.customerModel.findById(dto.customerId);
        const paymentProfile = await this.paymentProfileModel.findById(dto.paymentProfileId);

        if (!customer || !paymentProfile) {
            throw new NotFoundException('Customer or Payment Profile not found');
        }

        // 1. Create ARB Subscription in Authorize.Net
        const authNetSubscriptionId = await this.authNetService.createSubscription(
            customer.authorizeNetCustomerId,
            paymentProfile.authorizeNetPaymentProfileId,
            {
                name: dto.planName,
                amount: dto.amount,
                intervalLength: dto.intervalLength,
                intervalUnit: dto.intervalUnit,
                startDate: dto.startDate || new Date().toISOString().split('T')[0],
                totalOccurrences: dto.totalOccurrences || 9999,
                trialAmount: dto.trialAmount,
                trialOccurrences: dto.trialOccurrences,
            },
        );

        // 2. Save in MongoDB
        const subscription = new this.subscriptionModel({
            ...dto,
            authorizeNetSubscriptionId: authNetSubscriptionId,
            status: SubscriptionStatus.ACTIVE,
        });

        return subscription.save();
    }

    async cancel(id: string): Promise<Subscription> {
        const subscription = await this.subscriptionModel.findById(id);
        if (!subscription) throw new NotFoundException('Subscription not found');

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
}
