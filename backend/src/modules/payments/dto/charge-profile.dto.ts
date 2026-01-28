import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChargeProfileDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    paymentProfileId: string;

    @ApiProperty({ example: 10.00 })
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiProperty({ description: 'Immediately capture funds (true) or just authorize (false)', default: true, required: false })
    @IsOptional()
    @IsBoolean()
    immediateCapture?: boolean = true;
}
