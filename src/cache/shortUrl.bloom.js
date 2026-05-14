import { getRedisClient } from "../configs/redis.js";
import { CACHE_KEYS } from "./keys.js";

export const addShortUrlToBloom = async (shortUrl) => {
    const redis = getRedisClient();

    await redis.sendCommand(["BF.ADD", CACHE_KEYS.BLOOM_SHORT_URL, shortUrl,]);
};

export const shortUrlExistsInBloom = async (shortUrl) => {
    const redis = getRedisClient();

    const result = await redis.sendCommand(["BF.EXISTS", CACHE_KEYS.BLOOM_SHORT_URL, shortUrl,]);

    return result === 1;
};