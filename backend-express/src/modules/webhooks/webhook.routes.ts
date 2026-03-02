import { Router } from "express";
import { WebhooksController } from "./webhook.controller";
import { verifyWebhookSignature } from "../../middlewares/webhook.middleware";

const router = Router();

// Listener endpoint with signature verification
/**
 * @openapi
 * /webhooks/listener:
 *   post:
 *     tags: [Webhooks]
 *     summary: Webhook listener for Authorize.net notifications
 *     description: This endpoint receives real-time event notifications from Authorize.net. Access is secured by a signature check.
 *     responses:
 *       200:
 *         description: Event received and processed
 */
router.post("/listener", verifyWebhookSignature, WebhooksController.handleWebhook);

export default router;
