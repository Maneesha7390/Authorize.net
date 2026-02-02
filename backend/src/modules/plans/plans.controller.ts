import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../schemas/user.schema';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Create a new plan (Admin only)' })
    create(@Body() dto: CreatePlanDto) {
        return this.plansService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List all active plans' })
    findAll(@Query('all') all?: string) {
        return this.plansService.findAll(all !== 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get plan details' })
    findOne(@Param('id') id: string) {
        return this.plansService.findOne(id);
    }

    @Put(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update plan (Admin only)' })
    update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
        return this.plansService.update(id, dto);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Delete plan (Admin only)' })
    remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
