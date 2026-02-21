import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CreatePaymentProfileDto } from './dto/create-payment-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

import { AddCardDto, AddCardResponseDto } from './dto/add-card.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {

    constructor(private readonly customersService: CustomersService) { }

    @Post('add-card')
    @ApiOperation({
        summary: 'Unified endpoint to create/retrieve customer and add a card',
        description: 'Check if customer exists by email. If not, creates one in Authorize.net and DB. Then adds the payment profile. Returns IDs needed for subscription.'
    })
    @ApiResponse({ status: 201, description: 'Customer and card ready for subscription', type: AddCardResponseDto })
    addCard(@Body() dto: AddCardDto, @Request() req) {
        return this.customersService.addCardAndSyncCustomer(dto, req.user.userId);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new customer profile' })
    @ApiResponse({ status: 201, description: 'Customer created successfully' })
    create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
        return this.customersService.create(createCustomerDto, req.user.userId);
    }

    @Post(':id/payment-profiles')
    @ApiOperation({ summary: 'Add a payment profile to a customer' })
    addPaymentProfile(
        @Param('id') id: string,
        @Body() dto: CreatePaymentProfileDto,
    ) {
        return this.customersService.addPaymentProfile(id, dto);
    }

    @Get(':id/payment-profiles')
    @ApiOperation({ summary: 'Get all payment profiles for a customer' })
    @ApiResponse({ status: 200, description: 'List of payment profiles' })
    getPaymentProfiles(@Param('id') id: string) {
        return this.customersService.findPaymentProfiles(id);
    }

    @Get()
    @ApiOperation({ summary: 'List all customers' })
    findAll() {
        return this.customersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get customer details' })
    findOne(@Param('id') id: string) {
        return this.customersService.findOne(id);
    }
}
