import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum TransactionStatus {
    PENDING = 'PENDING',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    VOIDED = 'VOIDED',
    REFUNDED = 'REFUNDED',
}

export enum TransactionType {
    CHARGE = 'CHARGE',
    AUTHORIZE = 'AUTHORIZE',
    CAPTURE = 'CAPTURE',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
    customerId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Subscription' })
    subscriptionId: string;

    @Prop()
    authorizeNetTransactionId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ enum: TransactionType, required: true })
    type: TransactionType;

    @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
    status: TransactionStatus;

    @Prop()
    responseCode: string;

    @Prop()
    responseText: string;

    @Prop()
    authCode: string;

    @Prop({ type: Object })
    rawResponse: any;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ authorizeNetTransactionId: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ customerId: 1 });
TransactionSchema.index({ status: 1 });
