import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class PaymentProfile extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', required: true })
    customerId: string;

    @Prop({ required: true })
    authorizeNetPaymentProfileId: string; // CIM Payment Profile ID

    @Prop()
    cardType: string;

    @Prop()
    last4: string;

    @Prop()
    expirationDate: string;

    @Prop({ default: false })
    isDefault: boolean;
}

export const PaymentProfileSchema = SchemaFactory.createForClass(PaymentProfile);
PaymentProfileSchema.index({ customerId: 1 });
PaymentProfileSchema.index({ authorizeNetPaymentProfileId: 1 });
