import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WebhookEvent extends Document {
    @Prop({ required: true, unique: true })
    eventId: string; // Authorize.Net notificationId

    @Prop({ required: true })
    eventType: string;

    @Prop({ type: Object, required: true })
    payload: any;

    @Prop({ default: false })
    processed: boolean;

    @Prop()
    processedAt: Date;

    @Prop()
    error: string;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
WebhookEventSchema.index({ eventType: 1 });

