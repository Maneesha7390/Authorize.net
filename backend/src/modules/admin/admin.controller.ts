import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {

    constructor(private readonly adminService: AdminService) { }

    @Get('users')
    @ApiOperation({
        summary: 'List all users with customer profile info and transaction count',
        description: 'Admin only. Returns every registered user along with their linked customer profile and total transaction count.',
    })
    getAllUsers() {
        return this.adminService.getAllUsers();
    }

    @Get('users/:userId/transactions')
    @ApiOperation({
        summary: 'Get all transactions for a specific user',
        description: 'Admin only. Returns all transactions (one-time + CIM saved-card) made by the specified user.',
    })
    getUserTransactions(@Param('userId') userId: string) {
        return this.adminService.getUserTransactions(userId);
    }

    @Get('users/:userId/subscriptions')
    @ApiOperation({
        summary: 'Get all subscriptions for a specific user',
        description: 'Admin only. Returns all ARB subscriptions associated with the specified user.',
    })
    getUserSubscriptions(@Param('userId') userId: string) {
        return this.adminService.getUserSubscriptions(userId);
    }
}
