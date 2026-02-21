import { Controller, Post, Get, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpgradeSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {

    constructor(private readonly subscriptionsService: SubscriptionsService) { }

    @Get('user')
    @ApiOperation({ summary: 'Get current user\'s subscriptions' })
    getMySubscriptions(@Request() req) {
        return this.subscriptionsService.findByUser(req.user.userId);
    }

    @Get('customer/:customerId')
    @ApiOperation({ summary: 'Get subscriptions for a specific customer' })
    getByCustomer(@Param('customerId') customerId: string, @Request() req) {
        return this.subscriptionsService.findByCustomer(customerId, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new recurring subscription (ARB)' })
    create(@Body() dto: CreateSubscriptionDto) {
        return this.subscriptionsService.create(dto);
    }

    @Get(':id/status')
    @ApiOperation({ summary: 'Get current status of a subscription from Authorize.Net' })
    getStatus(@Param('id') id: string) {
        return this.subscriptionsService.getStatus(id);
    }

    @Put(':id/cancel')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Cancel an active subscription' })
    cancel(@Param('id') id: string, @Request() req) {
        return this.subscriptionsService.cancel(id, req.user);
    }

    @Put(':id/upgrade')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Upgrade/Downgrade an active subscription (with proration)' })
    upgrade(@Param('id') id: string, @Body() dto: UpgradeSubscriptionDto, @Request() req) {
        return this.subscriptionsService.upgrade(id, dto, req.user);
    }

    @Post(':id/pause')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Pause (Suspend) an active subscription' })
    pause(@Param('id') id: string, @Request() req) {
        return this.subscriptionsService.pause(id, req.user);
    }

    @Post(':id/resume')
    @Roles(UserRole.ADMIN, UserRole.USER)
    @ApiOperation({ summary: 'Resume a suspended subscription' })
    resume(@Param('id') id: string, @Request() req) {
        return this.subscriptionsService.resume(id, req.user);
    }
}
