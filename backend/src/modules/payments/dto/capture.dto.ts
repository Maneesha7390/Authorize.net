import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional } from 'class-validator';

export class CaptureDto {
    @ApiPropertyOptional({
        example: 25.00,
        description: 'The amount to capture. If omitted, the full authorized amount will be captured.',
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    amount?: number;
}
