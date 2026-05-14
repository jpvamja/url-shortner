import app from "./app.js";
import env from "./configs/env.js";
import connectDB from "./configs/db.js";
import { connectNats, getNatsClient } from "./configs/nats.js";
import { connectRedis, getRedisClient } from "./configs/redis.js";

let server;

const start = async () => {
    try {
        await connectDB(env.MONGODB_URL);
        await connectNats(env.NATS_URL);
        await connectRedis(env.REDIS_URL);
        server = app.listen(env.PORT, () => {
            console.log(`Server running on port ${env.PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

const gracefulShutdown = async () => {
    console.log("Received shutdown signal, closing gracefully...");

    try {
        const nc = getNatsClient();
        await nc.drain();
        await nc.close();
        console.log("NATS closed");
    } catch (err) {
        console.log("NATS already closed");
    }

    try {
        const redis = getRedisClient();
        await redis.quit();
        console.log("Redis closed");
    } catch (err) {
        console.log("Redis already closed");
    }

    if (server) {
        server.close(() => {
            console.log("HTTP server closed");
            process.exit(0);
        });
    }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

start();