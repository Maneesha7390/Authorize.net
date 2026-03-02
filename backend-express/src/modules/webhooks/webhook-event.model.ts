import mongoose, { Schema, Document } from "mongoose";

export interface IWebhookEvent extends Document {
    eventId: string; // Authorize.Net notificationId
    eventType: string;
    payload: any;
    processed: boolean;
    processedAt?: Date;
    error?: string;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
        },
        eventType: {
            type: String,
            required: true,
        },
        payload: {
            type: Schema.Types.Mixed,
            required: true,
        },
        processed: {
            type: Boolean,
            default: false,
        },
        processedAt: {
            type: Date,
        },
        error: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

webhookEventSchema.index({ eventId: 1 });
webhookEventSchema.index({ eventType: 1 });

export const WebhookEvent = mongoose.model<IWebhookEvent>(
    "WebhookEvent",
    webhookEventSchema
);
