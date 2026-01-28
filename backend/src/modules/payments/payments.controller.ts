import { Controller, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ChargeProfileDto } from './dto/charge-profile.dto';
import { RefundDto } from './dto/refund.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {

    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('charge')
    @ApiOperation({ summary: 'Charge a saved customer profile' })
    charge(@Body() dto: ChargeProfileDto) {
        return this.paymentsService.chargeProfile(dto);
    }

    @Post(':id/capture')
    @ApiOperation({ summary: 'Capture an authorized transaction' })
    capture(@Param('id') id: string, @Body('amount') amount: number) {
        return this.paymentsService.capture(id, amount);
    }

    @Post('refund')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Refund a transaction (Admin only)' })
    refund(@Body() dto: RefundDto) {
        return this.paymentsService.refund(dto);
    }

    @Put(':id/void')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Void a transaction (Admin only)' })
    void(@Param('id') id: string) {
        return this.paymentsService.void(id);
    }
}
