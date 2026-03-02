import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export class AdminController {
    static getAllUsers = asyncHandler(async (req: Request, res: Response) => {
        const users = await AdminService.getAllUsers();
        return res.status(200).json(new ApiResponse(200, users, "All users retrieved"));
    });

    static getUserTransactions = asyncHandler(async (req: Request, res: Response) => {
        const transactions = await AdminService.getUserTransactions(req.params.userId as string);
        return res.status(200).json(new ApiResponse(200, transactions, "User transactions retrieved"));
    });

    static getUserSubscriptions = asyncHandler(async (req: Request, res: Response) => {
        const subscriptions = await AdminService.getUserSubscriptions(req.params.userId as string);
        return res.status(200).json(new ApiResponse(200, subscriptions, "User subscriptions retrieved"));
    });

    static getUserDetails = asyncHandler(async (req: Request, res: Response) => {
        const details = await AdminService.getUserDetails(req.params.userId as string);
        return res.status(200).json(new ApiResponse(200, details, "User details retrieved"));
    });
}
