import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";

export const verifyWebhookSignature = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const signature = req.headers["x-anet-signature"];
    const key = process.env.WEBHOOK_SIGNATURE_KEY;

    if (!signature || !key) {
        // In local development, we might just log and continue if no key is set
        // but for production-ready code, we should enforce it.
        if (config.nodeEnv === "production") {
            throw new ApiError(401, "Missing webhook signature or secret key");
        }
        console.warn("Skipping webhook signature verification in development (No key set)");
        return next();
    }

    const body = JSON.stringify(req.body);
    const expectedSignature =
        "sha512=" +
        crypto
            .createHmac("sha512", key)
            .update(body)
            .digest("hex")
            .toUpperCase();

    if ((signature as string).toUpperCase() !== expectedSignature) {
        if (config.nodeEnv === "production") {
            throw new ApiError(401, "Invalid webhook signature");
        }
        console.warn("Invalid webhook signature detected in development");
    }

    next();
};
