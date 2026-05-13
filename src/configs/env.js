import dotenv from "dotenv";

dotenv.config();

const env = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",

    MONGODB_URL: process.env.MONGODB_URL,

    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

    API_PREFIX: process.env.API_PREFIX || "/api/v1",
    BASE_URL: process.env.BASE_URL || "http://localhost:3000",

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
};

export default env;
