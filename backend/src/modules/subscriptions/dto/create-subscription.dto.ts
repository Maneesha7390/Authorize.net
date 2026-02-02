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

    @ApiProperty({ description: 'ID of the pre-defined plan' })
    @IsString()
    @IsNotEmpty()
    planId: string;

    @ApiProperty({ example: 'Premium Plan', required: false })
    @IsString()
    @IsOptional()
    planName?: string;

    @ApiProperty({ example: 49.99, required: false })
    @IsNumber()
    @Min(0.01)
    @IsOptional()
    amount?: number;

    @ApiProperty({ example: 1, required: false })
    @IsNumber()
    @IsOptional()
    intervalLength?: number;

    @ApiProperty({ example: 'months', enum: ['days', 'months'], required: false })
    @IsString()
    @IsOptional()
    @IsEnum(['days', 'months'])
    intervalUnit?: string;

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

export class UpgradeSubscriptionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    newPlanId: string;

    @ApiProperty({ description: 'Optional override for the new amount', required: false })
    @IsNumber()
    @IsOptional()
    @Min(0.01)
    newAmount?: number;
}
