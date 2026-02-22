import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OpaqueDataDto {
    @ApiProperty({
        description: 'The data descriptor returned by Accept.js',
        example: 'COMMON.ACCEPT.INAPP.PAYMENT'
    })
    @IsString()
    @IsNotEmpty()
    dataDescriptor: string;

    @ApiProperty({
        description: 'The data value (encrypted token) returned by Accept.js',
        example: 'eyJjb2RlIjoiNT... (long token)'
    })
    @IsString()
    @IsNotEmpty()
    dataValue: string;
}

/**
 * DTO for ONE-TIME payments using Accept.js Opaque Data.
 * This is the PCI-compliant way to handle one-time payments.
 */
export class OneTimeOpaquePaymentDto {
    @ApiProperty({ type: OpaqueDataDto, description: 'Accept.js generated opaque payment data' })
    @ValidateNested()
    @Type(() => OpaqueDataDto)
    opaqueData: OpaqueDataDto;

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
