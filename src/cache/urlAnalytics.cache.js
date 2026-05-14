import { getRedisClient } from "../configs/redis.js";
import { CACHE_KEYS } from "./keys.js";

export const incrementClickCount = async (urlId) => {
    const redis = getRedisClient();

    return await redis.incr( CACHE_KEYS.CLICK_COUNT(urlId) );
};

export const getClickCountCache = async (urlId) => {
    const redis = getRedisClient();

    return await redis.get( CACHE_KEYS.CLICK_COUNT(urlId) );
};

export const setAnalyticsCache = async ( urlId, data, ttl = 60 ) => {
    const redis = getRedisClient();

    await redis.set( CACHE_KEYS.URL_ANALYTICS(urlId), JSON.stringify(data), { EX: ttl, } );
};