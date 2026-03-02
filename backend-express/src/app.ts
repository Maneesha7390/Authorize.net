import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { ApiError } from "./utils/ApiError";
import { ApiResponse } from "./utils/ApiResponse";
import { errorMiddleware } from "./middlewares/error.middleware";

import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

const app = express();

// Swagger will be moved down

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json(new ApiResponse(200, null, "Server is running"));
});

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
import authRoutes from "./modules/auth/auth.routes";
import customerRoutes from "./modules/customers/customer.routes";
import planRoutes from "./modules/plans/plan.routes";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes";
import webhookRoutes from "./modules/webhooks/webhook.routes";
import paymentRoutes from "./modules/payments/payments.routes";
import adminRoutes from "./modules/admin/admin.routes";

// Route Declarations
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/admin", adminRoutes);

// 404 Handler
app.use((req, res, next) => {
    next(new ApiError(404, `Cannot ${req.method} ${req.originalUrl}`));
});

// Error Handling
app.use(errorMiddleware);

export { app };
