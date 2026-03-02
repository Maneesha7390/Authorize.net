import mongoose, { Schema, Document } from "mongoose";

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    SUSPENDED = "SUSPENDED",
    CANCELED = "CANCELED",
    TERMINATED = "TERMINATED",
}

export interface ISubscription extends Document {
    customerId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    paymentProfileId: mongoose.Types.ObjectId;
    authorizeNetSubscriptionId: string;
    planName: string;
    amount: number;
    status: SubscriptionStatus;
    startDate?: Date;
    intervalLength?: number;
    intervalUnit?: string;
    totalOccurrences?: number;
    trialAmount?: number;
    trialOccurrences?: number;
}

const subscriptionSchema = new Schema<ISubscription>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: "Plan",
            required: true,
        },
        paymentProfileId: {
            type: Schema.Types.ObjectId,
            ref: "PaymentProfile",
            required: true,
        },
        authorizeNetSubscriptionId: {
            type: String,
            required: true,
        },
        planName: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(SubscriptionStatus),
            default: SubscriptionStatus.ACTIVE,
        },
        startDate: {
            type: Date,
        },
        intervalLength: {
            type: Number,
        },
        intervalUnit: {
            type: String,
        },
        totalOccurrences: {
            type: Number,
        },
        trialAmount: {
            type: Number,
        },
        trialOccurrences: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

subscriptionSchema.index({ authorizeNetSubscriptionId: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = mongoose.model<ISubscription>(
    "Subscription",
    subscriptionSchema
);
