import mongoose, { Schema, Document } from "mongoose";

export enum TransactionStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    VOIDED = "VOIDED",
    REFUNDED = "REFUNDED",
    SETTLED = "SETTLED",
}

export enum TransactionType {
    CHARGE = "CHARGE",
    AUTHORIZE = "AUTHORIZE",
    CAPTURE = "CAPTURE",
}

export interface ITransaction extends Document {
    userId?: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    subscriptionId?: mongoose.Types.ObjectId;
    authorizeNetTransactionId?: string;
    amount: number;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    responseCode?: string;
    responseText?: string;
    authCode?: string;
    rawResponse?: any;
}

const transactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
        },
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: "Subscription",
        },
        authorizeNetTransactionId: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "USD",
        },
        type: {
            type: String,
            enum: Object.values(TransactionType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(TransactionStatus),
            default: TransactionStatus.PENDING,
        },
        responseCode: {
            type: String,
        },
        responseText: {
            type: String,
        },
        authCode: {
            type: String,
        },
        rawResponse: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

transactionSchema.index({ authorizeNetTransactionId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ customerId: 1 });
transactionSchema.index({ status: 1 });

export const Transaction = mongoose.model<ITransaction>(
    "Transaction",
    transactionSchema
);
