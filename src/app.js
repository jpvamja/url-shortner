import express from 'express';

import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import errorMiddleware from "./middlewares/error.middleware.js";
import ApiResponse from "./utils/apiResponse.js";
import limiter from "./middlewares/rateLimiter.middleware.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN.split(","),
    credentials: true,
}));
app.use(compression());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(limiter);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/health", async (req, res) => {
    res.status(200).json(
        new ApiResponse(
            200,
            {
                status: "OK",
                uptime: process.uptime(),
                timestamp: Date.now(),
            },
            "Service is healthy"
        )
    );
});

app.use((req, res) => {
    res.status(404).json(
        new ApiResponse(404, null, "Route not found")
    );
});

app.use(errorMiddleware);

export default app;