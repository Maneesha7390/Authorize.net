import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundDto {
    @ApiProperty({ description: 'The MongoDB _id of the original transaction' })
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @ApiProperty({ example: 10.00 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Last 4 digits of the card (Optional, will try to extract from transaction if not provided)' })
    @IsString()
    @IsOptional()
    last4?: string;

    @ApiProperty({ description: 'Expiration date in MMYY or MM/YY format (Required for raw card refunds)' })
    @IsString()
    @IsOptional()
    expirationDate?: string;

    @ApiProperty({ description: 'Card type (e.g., Visa, MasterCard)', required: false })
    @IsString()
    @IsOptional()
    cardType?: string;

    @ApiProperty({ example: 'Customer request' })
    @IsString()
    @IsOptional()
    reason?: string;
}
