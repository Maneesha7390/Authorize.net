import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 3001,
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/authorize-net",
    jwtSecret: process.env.JWT_SECRET || "default_secret",
    jwtExpiry: process.env.JWT_EXPIRY || "1d",
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigin: process.env.CORS_ORIGIN || "*",
};
