import { Router } from "express";
import { AdminController } from "./admin.controller";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware";
import { UserRole } from "../auth/auth.model";

const router = Router();

// Admin prefix routes, protected by JWT and role restriction
router.use(verifyJWT, restrictTo(UserRole.ADMIN));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users retrieved with stats
 */
router.get("/users", AdminController.getAllUsers);

/**
 * @openapi
 * /admin/users/{userId}/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all transactions for a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User transactions retrieved
 */
router.get("/users/:userId/transactions", AdminController.getUserTransactions);

/**
 * @openapi
 * /admin/users/{userId}/subscriptions:
 *   get:
 *     tags: [Admin]
 *     summary: Get all subscriptions for a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User subscriptions retrieved
 */
router.get("/users/:userId/subscriptions", AdminController.getUserSubscriptions);

/**
 * @openapi
 * /admin/users/{userId}/details:
 *   get:
 *     tags: [Admin]
 *     summary: Get full user details (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved
 */
router.get("/users/:userId/details", AdminController.getUserDetails);

export default router;
