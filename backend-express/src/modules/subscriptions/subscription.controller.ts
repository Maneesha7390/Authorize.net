import { Request, Response } from "express";
import { SubscriptionsService } from "./subscription.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class SubscriptionsController {
    static create = asyncHandler(async (req: Request, res: Response) => {
        const subscription = await SubscriptionsService.create(req.body);
        return res
            .status(201)
            .json(new ApiResponse(201, subscription, "Subscription created successfully"));
    });

    static getMySubscriptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const subscriptions = await SubscriptionsService.findByUser(req.user._id);
        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Subscriptions retrieved successfully"));
    });

    static getByCustomer = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const subscriptions = await SubscriptionsService.findByCustomer(req.params.customerId as string, req.user);
        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Customer subscriptions retrieved"));
    });

    static getStatus = asyncHandler(async (req: Request, res: Response) => {
        const status = await SubscriptionsService.getStatus(req.params.id as string);
        return res
            .status(200)
            .json(new ApiResponse(200, { status }, "Subscription status retrieved"));
    });

    static cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await SubscriptionsService.cancel(req.params.id as string, req.user);
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Subscription canceled successfully"));
    });

    static pause = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await SubscriptionsService.pause(req.params.id as string, req.user);
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Subscription paused successfully"));
    });

    static resume = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await SubscriptionsService.resume(req.params.id as string, req.user);
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Subscription resumed successfully"));
    });

    static upgrade = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await SubscriptionsService.upgrade(req.params.id as string, req.body, req.user);
        return res
            .status(200)
            .json(new ApiResponse(200, result, "Subscription upgraded successfully"));
    });
}
