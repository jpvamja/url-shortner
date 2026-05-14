import net from "net";
import { nanoid } from "nanoid";

import ApiError from "../utils/apiError.js";
import getPagination from "../utils/pagination.js";

import Url from "../models/url.model.js";
import UrlVisit from "../models/urlVisit.model.js";

// REDIS CACHE IMPORTS
// IMPORT REDIS CACHE METHODS HERE

// Example:
// import {
//     getShortUrlCache,
//     setShortUrlCache,
//     deleteShortUrlCache,
// } from "../cache/shortUrl.cache.js";

// BLOOM FILTER IMPORTS
// IMPORT BLOOM FILTER METHODS HERE

// Example:
// import {
//     addShortUrlToBloom,
//     shortUrlExistsInBloom,
// } from "../cache/shortUrl.bloom.js";

const isPrivateIPv4 = (ip) => {
    const parts = ip.split(".").map(Number);

    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
        return true;
    }

    return (parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) || parts[0] === 0 || parts[0] >= 224);
};

const isPrivateIPv6 = (ip) => {
    const normalized = ip.toLowerCase();

    return (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd"));
};

const isBlockedHost = (hostname) => {
    const host = hostname.toLowerCase();

    return (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local"));
};

const validateOriginalUrl = async (originalUrl) => {
    if (typeof originalUrl !== "string" || !originalUrl.trim()) {
        throw new ApiError(400, "Original URL is required");
    }

    const value = originalUrl.trim();

    if (value.length > 2048) {
        throw new ApiError(400, "URL is too long");
    }

    let parsed;

    try {
        parsed = new URL(value);
    } catch {
        throw new ApiError(400, "Invalid URL format");
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new ApiError(400, "Only HTTP/HTTPS URLs are allowed");
    }

    if (parsed.username || parsed.password) {
        throw new ApiError(400, "URLs with credentials are not allowed");
    }

    if (isBlockedHost(parsed.hostname)) {
        throw new ApiError(400, "Localhost URLs are not allowed");
    }

    if (net.isIP(parsed.hostname)) {
        const isPrivate = (net.isIP(parsed.hostname) === 4 && isPrivateIPv4(parsed.hostname)) || (net.isIP(parsed.hostname) === 6 && isPrivateIPv6(parsed.hostname));

        if (isPrivate) {
            throw new ApiError(400, "Private or local network URLs are not allowed");
        }
    }

    return parsed.toString();
};

const RESERVED_CODES = new Set(["admin", "api", "dashboard", "login", "signup", "support",]);

const validateCustomUrlCode = (customUrl) => {
    if (typeof customUrl !== "string" || !customUrl.trim()) {
        throw new ApiError(400, "Custom URL code is required");
    }

    const code = customUrl.trim().toLowerCase();

    if (code.length < 6 || code.length > 8) {
        throw new ApiError(400, "Custom URL code must be 6 to 8 characters long");
    }

    if (!/^[a-zA-Z0-9]+$/.test(code)) {
        throw new ApiError(400, "Custom URL code can only contain letters and numbers");
    }

    if (RESERVED_CODES.has(code)) {
        throw new ApiError(400, "Custom URL code is reserved");
    }

    return code;
};

const MAX_GENERATION_ATTEMPTS = 20;

const BASE62_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const toBase62 = (value) => {
    let number = 0n;

    for (const char of value) {
        number = number * 256n + BigInt(char.charCodeAt(0));
    }

    if (number === 0n) {
        return "0";
    }

    let output = "";

    while (number > 0n) {
        output = BASE62_ALPHABET[Number(number % 62n)] + output;

        number /= 62n;
    }

    return output;
};

const generateGeneratedShortUrl = async () => {

    // BLOOM FILTER CHECK HERE
    // before MongoDB exists() query
    // Example flow:
    // 1. generate short code
    // 2. check Bloom filter
    // 3. if maybe exists → continue
    // 4. if definitely not exists → use directly

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
        const base62Code = toBase62(nanoid(5));

        if (base62Code.length < 6 || base62Code.length > 8) {
            continue;
        }

        const existingUrl = await Url.exists({ shortUrl: base62Code, });
        if (existingUrl) {
            continue;
        }

        return base62Code;
    }

    throw new ApiError(500, "Failed to generate unique short URL");
};

async function createShortUrlService(originalUrl, customUrl = null) {

    // AFTER SUCCESSFUL URL CREATION:
    // 1. STORE shortUrl → originalUrl in Redis cache
    // 2. ADD shortUrl into Bloom filter
    // because:
    // newly-created URLs are likely to be accessed immediately

    const validatedOriginalUrl = await validateOriginalUrl(originalUrl);

    if (customUrl) {
        const validatedCustomUrl = validateCustomUrlCode(customUrl);

        try {
            const existingUrl = await Url.findOne({ shortUrl: validatedCustomUrl, }).lean();

            if (existingUrl) {
                throw new ApiError(409, "Custom URL already exists");
            }

            const createdUrl = await Url.create({ originalUrl: validatedOriginalUrl, shortUrl: validatedCustomUrl, codeType: "custom", });

            // ==========================
            // REDIS CACHE WRITE HERE
            // ==========================
            //
            // cache:
            // shortUrl -> originalUrl
            //
            // Example:
            //
            // await setShortUrlCache(
            //     createdUrl.shortUrl,
            //     {
            //         _id: createdUrl._id,
            //         originalUrl: createdUrl.originalUrl,
            //         shortUrl: createdUrl.shortUrl,
            //     }
            // );
            //
            //
            // ==========================
            // BLOOM FILTER ADD HERE
            // ==========================
            //
            // await addShortUrlToBloom(
            //     createdUrl.shortUrl
            // );

            return {
                id: createdUrl._id,
                originalUrl: createdUrl.originalUrl,
                shortUrl: createdUrl.shortUrl,
                createdAt: createdUrl.createdAt,
            };
        } catch (error) {
            if (error?.code === 11000) {
                throw new ApiError(409, "Custom URL already exists");
            }
            throw error;
        }
    };

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
        const generatedShortUrl = await generateGeneratedShortUrl();

        try {
            const existingUrl = await Url.findOne({ shortUrl: generatedShortUrl, }).lean();

            if (existingUrl) {
                continue;
            }

            const createdUrl = await Url.create({ originalUrl: validatedOriginalUrl, shortUrl: generatedShortUrl, codeType: "generated", });

            // ==========================
            // REDIS CACHE WRITE HERE
            // ==========================
            //
            // store generated short URL
            // into Redis cache
            //
            //
            // ==========================
            // BLOOM FILTER ADD HERE
            // ==========================
            //
            // add generated short URL
            // into Bloom filter

            return {
                id: createdUrl._id,
                originalUrl: createdUrl.originalUrl,
                shortUrl: createdUrl.shortUrl,
                createdAt: createdUrl.createdAt,
            };
        } catch (error) {
            if (error?.code === 11000) {
                continue;
            }
            throw error;
        }
    }
    throw new ApiError(500, "Failed to generate unique short URL");
}

async function redirectToOriginalUrlService(shortUrl) {

    // BLOOM FILTER CHECK HERE
    // FIRST CHECK:
    // await shortUrlExistsInBloom()
    // if definitely not exists:
    // reject immediately
    // prevents MongoDB spam attacks
    // FLOW:
    // request
    //   ↓
    // bloom filter
    //   ↓
    // reject invalid quickly

    // REDIS CACHE READ HERE
    // MOST IMPORTANT CACHE LOCATION
    // FLOW:
    // 1. check Redis cache
    // 2. if hit → return immediately
    // 3. if miss → query MongoDB
    // 4. store result back in Redis
    // this endpoint gets hit on EVERY redirect

    const validatedShortUrl = validateCustomUrlCode(shortUrl);

    const existingUrl = await Url.findOne({ shortUrl: validatedShortUrl, isActive: true, }).lean();

    if (!existingUrl) {
        throw new ApiError(404, "URL not found");
    }

    const response = {
        _id: existingUrl._id,
        originalUrl: existingUrl.originalUrl,
        shortUrl: existingUrl.shortUrl,
    };

    // REDIS CACHE WRITE HERE
    // store MongoDB result into Redis cache
    // Example:
    // await setShortUrlCache(
    //     validatedShortUrl,
    //     response
    // );

    return response;
}

async function detailsOfShortUrlService(shortUrl, query = {}) {
    const validatedShortUrl = validateCustomUrlCode(shortUrl);

    // REDIS CACHE HERE
    // analytics endpoint can use:
    // SHORT TTL CACHE
    // because analytics changes often
    // good TTL:
    // 30 sec
    // 60 sec
    // GOOD CACHE TARGETS:
    // - click counts
    // - URL metadata
    // BAD CACHE TARGETS:
    // - paginated visit lists

    const { page, limit, skip } = getPagination(query);

    const url = await Url.findOne({ shortUrl: validatedShortUrl, }).select("_id shortUrl clickCount createdAt").lean();

    if (!url) {
        throw new ApiError(404, "URL not found");
    }

    const filter = { urlId: url._id, };

    const [total, data] = await Promise.all([
        UrlVisit.countDocuments(filter),

        UrlVisit.find(filter).sort({ clickedAt: -1, }).skip(skip).limit(limit).lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    const response = {
        shortUrl: validatedShortUrl,
        totalClicks: url.clickCount || total,
        createdAt: url.createdAt,
        page,
        limit,
        total,
        totalPages,
        data,
    };

    return response;
}

export {
    createShortUrlService,
    redirectToOriginalUrlService,
    detailsOfShortUrlService
}