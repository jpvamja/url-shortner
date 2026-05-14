import express from "express";

import asyncHandler from "../utils/asyncHandler.js";

import {
    createShortUrl,
    redirectToOriginalUrl,
    detailsOfShortUrl,
} from "../controllers/url.controller.js";

const router = express.Router();

router.post(
    "/shortener",
    asyncHandler(createShortUrl)
);

router.get(
    "/:shortUrl",
    asyncHandler(redirectToOriginalUrl)
);

router.get(
    "/details/:shortUrl",
    asyncHandler(detailsOfShortUrl)
);

export default router;