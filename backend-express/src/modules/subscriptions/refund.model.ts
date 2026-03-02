import mongoose, { Schema, Document } from "mongoose";

export interface IRefund extends Document {
    originalTransactionId: mongoose.Types.ObjectId;
    authorizeNetRefundTransactionId: string;
    amount: number;
    reason?: string;
    status: string;
}

const refundSchema = new Schema<IRefund>(
    {
        originalTransactionId: {
            type: Schema.Types.ObjectId,
            ref: "Transaction",
            required: true,
        },
        authorizeNetRefundTransactionId: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
        },
        status: {
            type: String,
            default: "SUCCESS",
        },
    },
    {
        timestamps: true,
    }
);

refundSchema.index({ originalTransactionId: 1 });
refundSchema.index({ authorizeNetRefundTransactionId: 1 });

export const Refund = mongoose.model<IRefund>("Refund", refundSchema);
