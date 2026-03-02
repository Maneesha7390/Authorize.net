import { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class PaymentsController {
    static getMyHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const history = await PaymentsService.findAllByUser(req.user._id);
        return res.status(200).json(new ApiResponse(200, history, "Payment history retrieved"));
    });

    static chargeOneTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const tx = await PaymentsService.chargeOneTime(req.body, req.user._id);
        return res.status(201).json(new ApiResponse(201, tx, "One-time payment processed"));
    });

    static chargeOpaque = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const tx = await PaymentsService.chargeOpaque(req.body, req.user._id);
        return res.status(201).json(new ApiResponse(201, tx, "Opaque payment processed"));
    });

    static chargeProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const tx = await PaymentsService.chargeProfile(req.body, req.user._id);
        return res.status(201).json(new ApiResponse(201, tx, "Profile charge processed"));
    });

    static capture = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const tx = await PaymentsService.capture(req.params.id as string, req.user, req.body.amount);
        return res.status(200).json(new ApiResponse(200, tx, "Transaction captured"));
    });

    static refund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await PaymentsService.refund(req.body, req.user);
        return res.status(200).json(new ApiResponse(200, result, "Refund processed"));
    });

    static void = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const tx = await PaymentsService.void(req.params.id as string, req.user);
        return res.status(200).json(new ApiResponse(200, tx, "Transaction voided"));
    });

    static createHostedPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await PaymentsService.createHostedPayment(req.body, req.user._id);
        return res.status(200).json(new ApiResponse(200, result, "Hosted payment token generated"));
    });

    static getCardDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const details = await PaymentsService.getCustomerCards(req.user._id);
        return res.status(200).json(new ApiResponse(200, details, "Card details retrieved"));
    });
}
