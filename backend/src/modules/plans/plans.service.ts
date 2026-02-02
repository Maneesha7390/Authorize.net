import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan } from '../../schemas/plan.schema';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
    constructor(@InjectModel(Plan.name) private planModel: Model<Plan>) { }

    async create(dto: CreatePlanDto): Promise<Plan> {
        const existing = await this.planModel.findOne({ name: dto.name });
        if (existing) {
            throw new ConflictException('Plan with this name already exists');
        }
        const plan = new this.planModel(dto);
        return plan.save();
    }

    async findAll(onlyActive: boolean = true): Promise<Plan[]> {
        const query = onlyActive ? { isActive: true } : {};
        return this.planModel.find(query).exec();
    }

    async findOne(id: string): Promise<Plan> {
        const plan = await this.planModel.findById(id);
        if (!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

    async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
        const plan = await this.planModel.findByIdAndUpdate(id, dto, { new: true });
        if (!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

    async remove(id: string): Promise<void> {
        const result = await this.planModel.findByIdAndDelete(id);
        if (!result) throw new NotFoundException('Plan not found');
    }
}
