import { IsNotEmpty, IsNumber, IsString, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    paymentProfileId: string;

    @ApiProperty({ example: 'Premium Plan' })
    @IsString()
    @IsNotEmpty()
    planName: string;

    @ApiProperty({ example: 49.99 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsNotEmpty()
    intervalLength: number;

    @ApiProperty({ example: 'months', enum: ['days', 'months'] })
    @IsString()
    @IsNotEmpty()
    @IsEnum(['days', 'months'])
    intervalUnit: string;

    @ApiProperty({ example: '2025-02-01', required: false })
    @IsString()
    @IsOptional()
    startDate?: string;

    @ApiProperty({ example: 9999, required: false })
    @IsNumber()
    @IsOptional()
    totalOccurrences?: number;

    @ApiProperty({ example: 0, required: false })
    @IsNumber()
    @IsOptional()
    trialAmount?: number;

    @ApiProperty({ example: 0, required: false })
    @IsNumber()
    @IsOptional()
    trialOccurrences?: number;
}
