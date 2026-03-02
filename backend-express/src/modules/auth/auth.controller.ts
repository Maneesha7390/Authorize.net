import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export class AuthController {
    static register = asyncHandler(async (req: Request, res: Response) => {
        const user = await AuthService.register(req.body);

        return res
            .status(201)
            .json(new ApiResponse(201, user, "User registered successfully"));
    });

    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const { user, token } = await AuthService.login(email, password);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        return res
            .status(200)
            .cookie("accessToken", token, options)
            .json(
                new ApiResponse(
                    200,
                    { user, token },
                    "User logged in successfully"
                )
            );
    });

    static logout = asyncHandler(async (req: Request, res: Response) => {
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully"));
    });
}
