import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreditCardDto {
    @ApiProperty({ description: 'The 16-digit credit card number', example: '4111111111111111' })
    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @ApiProperty({ description: 'Expiration date in MM/YY format', example: '12/30' })
    @IsString()
    @IsNotEmpty()
    expirationDate: string;

    @ApiProperty({ description: 'The 3 or 4 digit card security code', example: '123' })
    @IsString()
    @IsNotEmpty()
    cardCode: string;
}

/**
 * DTO for ONE-TIME raw card payments.
 * No customer profile or payment profile IDs required.
 * Just supply card details + amount.
 */
export class OneTimePaymentDto {
    @ApiProperty({ type: CreditCardDto, description: 'Raw card details for a one-time payment' })
    @ValidateNested()
    @Type(() => CreditCardDto)
    cardDetails: CreditCardDto;

    @ApiProperty({ example: 10.00, description: 'Amount to charge in USD' })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({
        description: 'true = immediately capture funds, false = authorize only',
        default: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    immediateCapture?: boolean = true;
}

/**
 * DTO for CIM profile-based payments (stored card).
 * Card details are NOT needed — the card was already saved.
 * Just provide the MongoDB IDs returned when the card was saved.
 */
export class ChargeProfileDto {
    @ApiProperty({ description: 'MongoDB customerId returned when the card was saved', example: '65d4b...' })
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty({ description: 'MongoDB paymentProfileId returned when the card was saved', example: '65e7c...' })
    @IsString()
    @IsNotEmpty()
    paymentProfileId: string;

    @ApiProperty({ example: 10.00, description: 'Amount to charge in USD' })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'true = immediately capture funds, false = authorize only', default: true, required: false })
    @IsOptional()
    @IsBoolean()
    immediateCapture?: boolean = true;
}
