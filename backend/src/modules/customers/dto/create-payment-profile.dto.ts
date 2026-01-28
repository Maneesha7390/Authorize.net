import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentProfileDto {
    @ApiProperty({ example: '4111111111111111' })
    @IsString()
    @IsNotEmpty()
    cardNumber: string;

    @ApiProperty({ example: '2025-12' })
    @IsString()
    @IsNotEmpty()
    expirationDate: string;

    @ApiProperty({ example: '123' })
    @IsString()
    @IsNotEmpty()
    @Length(3, 4)
    cardCode: string;

    @ApiProperty({ example: 'Visa' })
    @IsString()
    @IsNotEmpty()
    cardType: string;
}
