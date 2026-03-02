import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
    userId: mongoose.Types.ObjectId;
    email: string;
    firstName: string;
    lastName: string;
    authorizeNetCustomerId: string;
    metadata?: Record<string, any>;
}

const customerSchema = new Schema<ICustomer>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        authorizeNetCustomerId: {
            type: String,
            required: true,
        },
        metadata: {
            type: Object,
        },
    },
    {
        timestamps: true,
    }
);

customerSchema.index({ authorizeNetCustomerId: 1 });
customerSchema.index({ userId: 1 });

export const Customer = mongoose.model<ICustomer>("Customer", customerSchema);
