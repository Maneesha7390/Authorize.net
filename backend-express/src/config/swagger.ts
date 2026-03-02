import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Authorize.net Integration API",
            version,
            description: "A production-ready Express.js API for Authorize.net Payment Gateway integration.",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: "http://localhost:3001/api/v1",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.ts"], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
