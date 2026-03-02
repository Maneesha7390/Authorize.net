import { Router } from "express";
import { PaymentsController } from "./payments.controller";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import {
    chargeOneTimeSchema,
    chargeOpaqueSchema,
    chargeProfileSchema,
    refundSchema,
    hostedPaymentSchema,
    captureSchema,
} from "./payments.validation";
import { UserRole } from "../auth/auth.model";

const router = Router();

router.use(verifyJWT);

/**
 * @openapi
 * /payments/user:
 *   get:
 *     tags: [Payments]
 *     summary: Get my payment history
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 */
router.get("/user", PaymentsController.getMyHistory);

/**
 * @openapi
 * /payments/charge/one-time:
 *   post:
 *     tags: [Payments]
 *     summary: Charge a card once (Direct)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, cardDetails]
 *             properties:
 *               amount:
 *                 type: number
 *               cardDetails:
 *                 type: object
 *                 required: [cardNumber, expirationDate, cardCode]
 *               immediateCapture:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Charge processed
 */
router.post("/charge/one-time", validate(chargeOneTimeSchema), PaymentsController.chargeOneTime);

/**
 * @openapi
 * /payments/charge/opaque:
 *   post:
 *     tags: [Payments]
 *     summary: Charge using Accept.js Opaque Data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, opaqueData]
 *             properties:
 *               amount:
 *                 type: number
 *               opaqueData:
 *                 type: object
 *                 required: [dataDescriptor, dataValue]
 *     responses:
 *       200:
 *         description: Charge processed
 */
router.post("/charge/opaque", validate(chargeOpaqueSchema), PaymentsController.chargeOpaque);

/**
 * @openapi
 * /payments/charge:
 *   post:
 *     tags: [Payments]
 *     summary: Charge a saved customer profile (CIM)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, customerId, paymentProfileId]
 *     responses:
 *       200:
 *         description: Charge processed
 */
router.post("/charge", validate(chargeProfileSchema), PaymentsController.chargeProfile);

/**
 * @openapi
 * /payments/{id}/capture:
 *   post:
 *     tags: [Payments]
 *     summary: Capture a previously authorized transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transaction captured
 */
router.post("/:id/capture", validate(captureSchema), PaymentsController.capture);

/**
 * @openapi
 * /payments/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund a transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, amount, last4, expirationDate]
 *     responses:
 *       200:
 *         description: Transaction refunded
 */
router.post("/refund", validate(refundSchema), PaymentsController.refund);

/**
 * @openapi
 * /payments/{id}/void:
 *   put:
 *     tags: [Payments]
 *     summary: Void a transaction
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
 *         description: Transaction voided
 */
router.put("/:id/void", PaymentsController.void);

/**
 * @openapi
 * /payments/hosted-payment:
 *   post:
 *     tags: [Payments]
 *     summary: Get token for Authorize.net Hosted Payment Page
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *     responses:
 *       200:
 *         description: Token retrieved
 */
router.post("/hosted-payment", validate(hostedPaymentSchema), PaymentsController.createHostedPayment);

/**
 * @openapi
 * /payments/card/details:
 *   get:
 *     tags: [Payments]
 *     summary: Get live card details from Authorize.net (CIM)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Card details retrieved
 */
router.get("/card/details", PaymentsController.getCardDetails);

export default router;
