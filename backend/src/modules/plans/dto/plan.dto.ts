import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum IntervalUnit {
    DAYS = 'days',
    WEEKS = 'weeks',
    MONTHS = 'months',
    YEARS = 'years'
}

export class CreatePlanDto {
    @ApiProperty({ example: 'Monthly Premium' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Premium monthly subscription plan' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 29.99 })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @Min(1)
    intervalLength: number;

    @ApiProperty({ example: 'months', enum: IntervalUnit })
    @IsEnum(IntervalUnit)
    intervalUnit: IntervalUnit;

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

export class UpdatePlanDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
