import mongoose from "mongoose";
import env from "../configs/env.js";
import { startClickConsumer, stopClickConsumer } from "../consumers/click.consumer.js";

const startWorker = async () => {
    try {
        await mongoose.connect(env.MONGODB_URL);
        console.log("Worker connected to MongoDB");

        startClickConsumer(env.NATS_URL);

    } catch (err) {
        console.error("Worker failed:", err);
        process.exit(1);
    }
};

process.on("SIGINT", async () => {
    console.log("Worker shutting down...");
    try {
        await stopClickConsumer();
    } catch (err) {
        console.error("Error stopping click consumer:", err);
    }

    try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
    } catch (err) {
        console.error("Error disconnecting MongoDB:", err);
    }

    process.exit(0);
});

startWorker();