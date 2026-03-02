import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyToken } from "../utils/jwt.util";
import { User } from "../modules/auth/auth.model";

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export const verifyJWT = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const token =
                req.cookies?.accessToken ||
                req.header("Authorization")?.replace("Bearer ", "");

            if (!token) {
                throw new ApiError(401, "Unauthorized request");
            }

            const decodedToken = verifyToken(token);

            const user = await User.findById(decodedToken?.id).select("-password");

            if (!user) {
                throw new ApiError(401, "Invalid Access Token");
            }

            req.user = user;
            next();
        } catch (error: any) {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
    }
);

// RBAC Middleware (Nested/Curried)
export const restrictTo = (...roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }
        next();
    };
};
