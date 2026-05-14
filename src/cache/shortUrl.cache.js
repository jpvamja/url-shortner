import { getRedisClient } from "../configs/redis.js";
import { CACHE_KEYS } from "./keys.js";

export const getShortUrlCache = async (shortUrl) => {
    const redis = getRedisClient();

    const data = await redis.get(CACHE_KEYS.SHORT_URL(shortUrl));

    return data ? JSON.parse(data) : null;
};

export const setShortUrlCache = async (shortUrl, value, ttl = 3600) => {
    const redis = getRedisClient();

    await redis.set(CACHE_KEYS.SHORT_URL(shortUrl), JSON.stringify(value), { EX: ttl, });
};

export const deleteShortUrlCache = async (shortUrl) => {
    const redis = getRedisClient();

    await redis.del(CACHE_KEYS.SHORT_URL(shortUrl));
};