import { IsNumber, IsString, Min, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHostedPaymentDto {
    @ApiProperty({ example: 50.0 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: true, required: false, description: 'True for immediate charge, false for authorize only' })
    @IsBoolean()
    @IsOptional()
    immediateCapture?: boolean;

    @ApiProperty({ example: 'https://example.com/payment-success', required: false })
    @IsString()
    @IsOptional()
    returnUrl?: string;

    @ApiProperty({ example: 'https://example.com/payment-cancel', required: false })
    @IsString()
    @IsOptional()
    cancelUrl?: string;
}
