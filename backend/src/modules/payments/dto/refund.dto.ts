import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    transactionId: string;

    @ApiProperty({ example: 10.00 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ example: 'Customer request' })
    @IsString()
    @IsOptional()
    reason?: string;
}
