import { Controller, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ChargeProfileDto } from './dto/charge-profile.dto';
import { RefundDto } from './dto/refund.dto';
import { CaptureDto } from './dto/capture.dto';
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
    @ApiBody({ type: CaptureDto, required: false })
    @Roles(UserRole.ADMIN, UserRole.USER)
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
}
