import app from "./app.js";
import env from "./configs/env.js";
import connectDB from "./configs/db.js";

let server;

const start = async () => {
    try {
        await connectDB(env.MONGODB_URL);

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