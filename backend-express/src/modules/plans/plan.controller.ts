import { Request, Response } from "express";
import { PlansService } from "./plan.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export class PlansController {
    static create = asyncHandler(async (req: Request, res: Response) => {
        const plan = await PlansService.create(req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, plan, "Plan created successfully"));
    });

    static findAll = asyncHandler(async (req: Request, res: Response) => {
        const onlyActive = req.query.all !== "true";
        const plans = await PlansService.findAll(onlyActive);
        return res
            .status(200)
            .json(new ApiResponse(200, plans, "Plans retrieved successfully"));
    });

    static findOne = asyncHandler(async (req: Request, res: Response) => {
        const plan = await PlansService.findOne(req.params.id as string);
        return res
            .status(200)
            .json(new ApiResponse(200, plan, "Plan details retrieved"));
    });

    static update = asyncHandler(async (req: Request, res: Response) => {
        const plan = await PlansService.update(req.params.id as string, req.body);
        return res
            .status(200)
            .json(new ApiResponse(200, plan, "Plan updated successfully"));
    });

    static remove = asyncHandler(async (req: Request, res: Response) => {
        await PlansService.remove(req.params.id as string);
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Plan deleted successfully"));
    });
}
