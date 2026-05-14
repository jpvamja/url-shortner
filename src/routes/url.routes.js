import express from "express";

import rateLimit from "express-rate-limit";

import asyncHandler from "../utils/asyncHandler.js";

import {
    createShortUrl,
    redirectToOriginalUrl,
    detailsOfShortUrl,
} from "../controllers/url.controller.js";

const createShortUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: {
        success: false,
        message: "Too many short URLs created. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const redirectToOriginalUrlLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 300,
    message: "Too many redirect requests.",
});

const detailsOfShortUrlLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: "Too many requests for details API.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();

router.post(
    "/shortener",
    createShortUrlLimiter,
    asyncHandler(createShortUrl)
);

router.get(
    "/:shortUrl",
    redirectToOriginalUrlLimiter,
    asyncHandler(redirectToOriginalUrl)
);

router.get(
    "/details/:shortUrl",
    detailsOfShortUrlLimiter,
    asyncHandler(detailsOfShortUrl)
);

export default router;