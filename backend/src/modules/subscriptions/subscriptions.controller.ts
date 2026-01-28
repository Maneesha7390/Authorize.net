import { Controller, Post, Get, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
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
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Cancel an active subscription (Admin only)' })
    cancel(@Param('id') id: string) {
        return this.subscriptionsService.cancel(id);
    }
}
