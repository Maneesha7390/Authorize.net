import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { AdminService } from '../admin/admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddCardDto, AddCardResponseDto } from './dto/add-card.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {

    constructor(
        private readonly customersService: CustomersService,
        private readonly adminService: AdminService,
    ) { }

    @Post('add-card')
    @ApiOperation({
        summary: 'Save a card — creates customer profile if not exists, then adds payment profile',
        description: 'Checks if a customer exists for the logged-in user. If not, creates one in Authorize.net and DB. Then adds the card as a payment profile. Returns IDs needed for CIM payments and subscriptions.',
    })
    @ApiResponse({ status: 201, description: 'Customer and card ready for payment/subscription', type: AddCardResponseDto })
    addCard(@Body() dto: AddCardDto, @Request() req) {
        return this.customersService.addCardAndSyncCustomer(dto, req.user.userId);
    }

    @Get('cards')
    @ApiOperation({ summary: 'Get all saved cards for the logged-in user' })
    async getMyCards(@Request() req) {
        return this.customersService.getCardsByUserId(req.user.userId);
    }

    @Get('me/details')
    @ApiOperation({ summary: 'Get all my details aggregate (Info + Profile + Transactions + Subscriptions)' })
    async getMyDetails(@Request() req) {
        return this.adminService.getUserDetails(req.user.userId);
    }
}

