import { Router } from "express";
import { PlansController } from "./plan.controller";
import { verifyJWT, restrictTo } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { createPlanSchema, updatePlanSchema } from "./plan.validation";
import { UserRole } from "../auth/auth.model";

const router = Router();

// Public route to list plans
/**
 * @openapi
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: Get all plans
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: If true, returns all plans including inactive ones
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 */
router.get("/", PlansController.findAll);

/**
 * @openapi
 * /plans/{id}:
 *   get:
 *     tags: [Plans]
 *     summary: Get plan details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan details retrieved
 */
router.get("/:id", PlansController.findOne);

// Admin only routes
router.use(verifyJWT);
router.use(restrictTo(UserRole.ADMIN));

/**
 * @openapi
 * /plans:
 *   post:
 *     tags: [Plans]
 *     summary: Create a new plan (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, amount, intervalLength, intervalUnit]
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               intervalLength:
 *                 type: number
 *               intervalUnit:
 *                 type: string
 *                 enum: [months, years]
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post("/", validate(createPlanSchema), PlansController.create);

/**
 * @openapi
 * /plans/{id}:
 *   put:
 *     tags: [Plans]
 *     summary: Update a plan (Admin)
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
 *     responses:
 *       200:
 *         description: Plan updated successfully
 */
router.put("/:id", validate(updatePlanSchema), PlansController.update);

/**
 * @openapi
 * /plans/{id}:
 *   delete:
 *     tags: [Plans]
 *     summary: Delete a plan (Admin)
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
 *         description: Plan deleted successfully
 */
router.delete("/:id", PlansController.remove);

export default router;
