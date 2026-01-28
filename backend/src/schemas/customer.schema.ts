import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Customer extends Document {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop()
    authorizeNetCustomerId: string; // CIM Customer Profile ID

    @Prop({ type: Object })
    metadata: Record<string, any>;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ authorizeNetCustomerId: 1 });

