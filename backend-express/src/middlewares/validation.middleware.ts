import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details
                .map((details) => details.message)
                .join(", ");
            throw new ApiError(400, errorMessage);
        }

        next();
    };
};
