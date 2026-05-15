import express from 'express';
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import errorMiddleware from "./middlewares/error.middleware.js";
import ApiResponse from "./utils/apiResponse.js";
import limiter from "./middlewares/rateLimiter.middleware.js";

import router from "./routes/index.routes.js";
import env from "./configs/env.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
const corsOrigins = (() => {
    const raw = env.CORS_ORIGIN ?? "*";
    if (raw === "*") return true;
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
})();

app.use(cors({
    origin: corsOrigins,
    credentials: true,
}));
app.use(compression());

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(limiter);

app.use(router);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
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