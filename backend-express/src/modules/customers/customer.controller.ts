import { Response } from "express";
import { CustomersService } from "./customer.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class CustomersController {
    static addCard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const result = await CustomersService.addCardAndSyncCustomer(
            req.body,
            req.user._id
        );

        return res
            .status(201)
            .json(new ApiResponse(201, result, "Card added successfully"));
    });

    static getMyCards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
        const cards = await CustomersService.getCardsByUserId(req.user._id);

        return res
            .status(200)
            .json(new ApiResponse(200, cards, "Cards retrieved successfully"));
    });
}
