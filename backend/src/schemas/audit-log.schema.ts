import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AuditLog extends Document {
    @Prop({ required: true })
    action: string;

    @Prop()
    userId: string;

    @Prop()
    resourceId: string;

    @Prop()
    resourceType: string;

    @Prop({ type: Object })
    oldValue: any;

    @Prop({ type: Object })
    newValue: any;

    @Prop()
    ipAddress: string;

    @Prop()
    userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ resourceId: 1 });
