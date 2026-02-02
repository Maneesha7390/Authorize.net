import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    SUSPENDED = 'SUSPENDED',
    CANCELED = 'CANCELED',
    TERMINATED = 'TERMINATED',
}

@Schema({ timestamps: true })
export class Subscription extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
    customerId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Plan', required: true })
    planId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PaymentProfile', required: true })
    paymentProfileId: string;

    @Prop({ required: true })
    authorizeNetSubscriptionId: string; // ARB Subscription ID

    @Prop({ required: true })
    planName: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Prop()
    startDate: Date;

    @Prop()
    intervalLength: number;

    @Prop()
    intervalUnit: string; // days, months

    @Prop()
    totalOccurrences: number;

    @Prop()
    trialAmount: number;

    @Prop()
    trialOccurrences: number;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
SubscriptionSchema.index({ authorizeNetSubscriptionId: 1 });
SubscriptionSchema.index({ customerId: 1 });
SubscriptionSchema.index({ status: 1 });
