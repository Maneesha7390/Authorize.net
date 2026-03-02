import { Router } from "express";
import { CustomersController } from "./customer.controller";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { addCardSchema } from "./customer.validation";

const router = Router();

// All routes in this module require authentication
router.use(verifyJWT);

/**
 * @openapi
 * /customers/add-card:
 *   post:
 *     tags: [Customers]
 *     summary: Add a new payment card
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cardNumber, expirationDate, cardCode, cardType]
 *             properties:
 *               cardNumber:
 *                 type: string
 *               expirationDate:
 *                 type: string
 *                 description: MM/YY format
 *               cardCode:
 *                 type: string
 *               cardType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Card added successfully
 */
router.post("/add-card", validate(addCardSchema), CustomersController.addCard);

/**
 * @openapi
 * /customers/cards:
 *   get:
 *     tags: [Customers]
 *     summary: Get my saved cards
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cards retrieved successfully
 */
router.get("/cards", CustomersController.getMyCards);

export default router;
