import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Refund extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction', required: true })
    originalTransactionId: string;

    @Prop()
    authorizeNetRefundTransactionId: string;

    @Prop({ required: true })
    amount: number;

    @Prop()
    reason: string;

    @Prop({ default: 'SUCCESS' })
    status: string;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
RefundSchema.index({ originalTransactionId: 1 });
RefundSchema.index({ authorizeNetRefundTransactionId: 1 });
