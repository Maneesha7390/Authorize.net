import mongoose, { Schema, Document } from "mongoose";

export interface IPlan extends Document {
    name: string;
    description?: string;
    amount: number;
    intervalLength: number;
    intervalUnit: 'months' | 'days' | 'weeks' | 'years';
    totalOccurrences: number;
    trialAmount: number;
    trialOccurrences: number;
    isActive: boolean;
}

const planSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
        },
        intervalLength: {
            type: Number,
            required: true,
        },
        intervalUnit: {
            type: String,
            required: true,
            enum: ["months", "days", "weeks", "years"],
        },
        totalOccurrences: {
            type: Number,
            default: 9999,
        },
        trialAmount: {
            type: Number,
            default: 0,
        },
        trialOccurrences: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

planSchema.index({ isActive: 1 });

export const Plan = mongoose.model<IPlan>("Plan", planSchema);
