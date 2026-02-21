import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCardDto {
    @ApiProperty({ description: 'Credit card number', example: '4111111111111111' })
    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @ApiProperty({ description: 'Expiration date (MM/YY)', example: '12/30' })
    @IsString()
    @IsNotEmpty()
    expirationDate: string;

    @ApiProperty({ description: '3 or 4 digit card security code', example: '123' })
    @IsString()
    @IsNotEmpty()
    @Length(3, 4)
    cardCode: string;

    @ApiProperty({ description: 'Type of card (Visa, MasterCard, etc.)', example: 'Visa' })
    @IsString()
    @IsNotEmpty()
    cardType: string;
}

export class AddCardResponseDto {
    @ApiProperty({ description: 'The Internal MongoDB Customer ID (USE THIS FOR SUBSCRIPTIONS)', example: '65d4b...' })
    customerId: string;

    @ApiProperty({ description: 'The Authorize.net Customer Profile ID', example: '90123456' })
    authorizeNetCustomerId: string;

    @ApiProperty({ description: 'The Internal MongoDB Payment Profile ID (USE THIS FOR SUBSCRIPTIONS)', example: '65e7c...' })
    paymentProfileId: string;

    @ApiProperty({ description: 'The Authorize.net Payment Profile ID', example: '98765432' })
    authorizeNetPaymentProfileId: string;

    @ApiProperty({ description: 'Last 4 digits of the card', example: '1111' })
    last4: string;

    @ApiProperty({ description: 'Brand of the card', example: 'Visa' })
    cardType: string;

    @ApiProperty({ description: 'Expiration date of the card', example: '12/30' })
    expirationDate: string;

    @ApiProperty({ description: 'Success message', example: 'Customer and card ready for subscription' })
    message: string;
}
