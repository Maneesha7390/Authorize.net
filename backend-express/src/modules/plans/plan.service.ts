import { Plan, IPlan } from "./plan.model";
import { ApiError } from "../../utils/ApiError";

export class PlansService {
    static async create(dto: any): Promise<IPlan> {
        const existing = await Plan.findOne({ name: dto.name });
        if (existing) {
            throw new ApiError(409, "Plan with this name already exists");
        }
        return await Plan.create(dto);
    }

    static async findAll(onlyActive: boolean = true): Promise<IPlan[]> {
        const query = onlyActive ? { isActive: true } : {};
        return await Plan.find(query).exec();
    }

    static async findOne(id: string): Promise<IPlan> {
        if (!id || id.length !== 24) {
            throw new ApiError(400, "Plan not found (Invalid ID format)");
        }
        const plan = await Plan.findById(id);
        if (!plan) throw new ApiError(404, "Plan not found");
        return plan;
    }

    static async update(id: string, dto: any): Promise<IPlan> {
        if (!id || id.length !== 24) {
            throw new ApiError(400, "Plan not found (Invalid ID format)");
        }
        const plan = await Plan.findByIdAndUpdate(id, dto, { new: true });
        if (!plan) throw new ApiError(404, "Plan not found");
        return plan;
    }

    static async remove(id: string): Promise<void> {
        if (!id || id.length !== 24) {
            throw new ApiError(400, "Plan not found (Invalid ID format)");
        }
        const result = await Plan.findByIdAndDelete(id);
        if (!result) throw new ApiError(404, "Plan not found");
    }
}
