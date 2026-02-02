import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Plan extends Document {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    intervalLength: number;

    @Prop({ required: true, enum: ['months', 'days', 'weeks', 'years'] })
    intervalUnit: string;

    @Prop({ default: 9999 })
    totalOccurrences: number;

    @Prop({ default: 0 })
    trialAmount: number;

    @Prop({ default: 0 })
    trialOccurrences: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
PlanSchema.index({ name: 1 });
PlanSchema.index({ isActive: 1 });
