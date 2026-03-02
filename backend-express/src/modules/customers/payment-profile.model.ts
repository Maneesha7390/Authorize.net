import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentProfile extends Document {
    customerId: mongoose.Types.ObjectId;
    authorizeNetPaymentProfileId: string;
    cardType?: string;
    last4?: string;
    expirationDate?: string;
    isDefault: boolean;
}

const paymentProfileSchema = new Schema<IPaymentProfile>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        authorizeNetPaymentProfileId: {
            type: String,
            required: true,
        },
        cardType: {
            type: String,
        },
        last4: {
            type: String,
        },
        expirationDate: {
            type: String,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

paymentProfileSchema.index({ customerId: 1 });
paymentProfileSchema.index({ authorizeNetPaymentProfileId: 1 });

export const PaymentProfile = mongoose.model<IPaymentProfile>(
    "PaymentProfile",
    paymentProfileSchema
);
