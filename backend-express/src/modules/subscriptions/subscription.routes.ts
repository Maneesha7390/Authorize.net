import { Router } from "express";
import { SubscriptionsController } from "./subscription.controller";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { createSubscriptionSchema, upgradeSubscriptionSchema } from "./subscription.validation";
import { UserRole } from "../auth/auth.model";

const router = Router();

// All subscription routes require authentication
router.use(verifyJWT);

/**
 * @openapi
 * /subscriptions:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a new subscription
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, paymentProfileId, planId]
 *             properties:
 *               customerId:
 *                 type: string
 *               paymentProfileId:
 *                 type: string
 *               planId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */
router.post("/", validate(createSubscriptionSchema), SubscriptionsController.create);

/**
 * @openapi
 * /subscriptions/user:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get my subscriptions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 */
router.get("/user", SubscriptionsController.getMySubscriptions);

/**
 * @openapi
 * /subscriptions/customer/{customerId}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscriptions for a specific customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer subscriptions retrieved
 */
router.get("/customer/:customerId", SubscriptionsController.getByCustomer);

/**
 * @openapi
 * /subscriptions/{id}/status:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get live subscription status from Authorize.net
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription status retrieved
 */
router.get("/:id/status", SubscriptionsController.getStatus);

// Lifecycle actions (Ownership checked in service)
/**
 * @openapi
 * /subscriptions/{id}/cancel:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Cancel a subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 */
router.put("/:id/cancel", SubscriptionsController.cancel);

/**
 * @openapi
 * /subscriptions/{id}/pause:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Pause a subscription (Suspend)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription paused successfully
 */
router.post("/:id/pause", SubscriptionsController.pause);

/**
 * @openapi
 * /subscriptions/{id}/resume:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Resume a paused subscription
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscription resumed successfully
 */
router.post("/:id/resume", SubscriptionsController.resume);

/**
 * @openapi
 * /subscriptions/{id}/upgrade:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Upgrade subscription with proration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPlanId]
 *             properties:
 *               newPlanId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
 */
router.put("/:id/upgrade", validate(upgradeSubscriptionSchema), SubscriptionsController.upgrade);

export default router;
