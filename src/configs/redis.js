import { createClient } from "redis";

let redisClient = null;

const connectRedis = async (redisUrl) => {
    try {
        redisClient = createClient({ url: redisUrl, });

        redisClient.on("error", (err) => {
            console.error("Redis error:", err);
        });

        await redisClient.connect();
        
        console.log("Redis connected");

        return redisClient;
    } catch (error) {
        console.error("Redis connection failed:", error);
        process.exit(1);
    }
};

const getRedisClient = () => {
    if (!redisClient) {
        throw new Error("Redis client not initialized");
    }

    return redisClient;
};

export { connectRedis, getRedisClient };