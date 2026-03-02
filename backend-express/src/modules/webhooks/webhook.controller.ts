import { Request, Response } from "express";
import { WebhooksService } from "./webhook.service";
import { asyncHandler } from "../../utils/asyncHandler";

export class WebhooksController {
    static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
        console.log("Webhook Controller Hit!");

        // Process asynchronously to avoid timeout from Authorize.Net
        // Authorize.Net expects a 200 OK within a narrow timeframe.
        WebhooksService.handleEvent(req.body).catch((err) => {
            console.error("Async webhook processing error:", err.message);
        });

        return res.status(200).json({ status: "received" });
    });
}
