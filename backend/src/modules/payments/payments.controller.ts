import { Controller, Post, Body, Param, Put, UseGuards, Request, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ChargeProfileDto, OneTimePaymentDto } from './dto/charge-profile.dto';
import { OneTimeOpaquePaymentDto } from './dto/charge-opaque.dto';
import { RefundDto } from './dto/refund.dto';
import { CaptureDto } from './dto/capture.dto';
import { CreateHostedPaymentDto } from './dto/hosted-payment.dto';
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

    @Get('user')
    @ApiOperation({ summary: 'Get current user\'s payment history' })
    getMyPayments(@Request() req) {
        return this.paymentsService.findAllByUser(req.user.userId);
    }

    @Post('charge/one-time')
    @ApiOperation({ summary: 'One-time raw card payment — no customer/profile ID needed, just card details + amount' })
    chargeOneTime(@Body() dto: OneTimePaymentDto, @Request() req) {
        return this.paymentsService.chargeOneTime(dto, req.user.userId);
    }

    @Post('charge/opaque')
    @ApiOperation({ summary: 'One-time payment using Accept.js Opaque Data (token)' })
    chargeOpaque(@Body() dto: OneTimeOpaquePaymentDto, @Request() req) {
        return this.paymentsService.chargeOpaque(dto, req.user.userId);
    }

    @Post('charge')
    @ApiOperation({ summary: 'Process a payment using a stored CIM profile (customerId + paymentProfileId required)' })
    charge(@Body() dto: ChargeProfileDto, @Request() req) {
        return this.paymentsService.chargeProfile(dto, req.user.userId);
    }

    @Post(':id/capture')
    @ApiOperation({ summary: 'Capture an authorized transaction (Admin only)' })
    @ApiBody({ type: CaptureDto, required: false })
    @Roles(UserRole.ADMIN)
    capture(@Param('id') id: string, @Request() req, @Body() dto?: CaptureDto) {
        return this.paymentsService.capture(id, req.user, dto?.amount);
    }

    @Post('refund')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Refund a transaction' })
    refund(@Body() dto: RefundDto, @Request() req) {
        return this.paymentsService.refund(dto, req.user);
    }

    @Put(':id/void')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Void a transaction' })
    void(@Param('id') id: string, @Request() req) {
        return this.paymentsService.void(id, req.user);
    }

    @Post('hosted-payment')
    @ApiOperation({ summary: 'Create hosted payment page token' })
    createHostedPayment(@Body() dto: CreateHostedPaymentDto, @Request() req) {
        return this.paymentsService.createHostedPayment(
            dto.amount,
            req.user.userId,
            dto.immediateCapture !== false, // default true
            dto.returnUrl,
            dto.cancelUrl,
        );
    }
}
