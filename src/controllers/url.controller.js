import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

import {
    createShortUrlService,
    redirectToOriginalUrlService,
    detailsOfShortUrlService
} from "../services/url.service.js";

async function createShortUrl(req, res) {
    const { originalUrl, customUrl } = req.body;

    const result = await createShortUrlService(originalUrl, customUrl);
    res.status(201).json(new ApiResponse(201, result, "URL shortened successfully"));
}

async function redirectToOriginalUrl(req, res) {
    const { shortUrl } = req.params;

    const result = await redirectToOriginalUrlService(shortUrl);
    res.status(200).json(new ApiResponse(200, result, "Redirecting to original URL"));
}

async function detailsOfShortUrl(req, res) {
    const { shortUrl } = req.params;
    const result = await detailsOfShortUrlService(shortUrl, req.query);
    res.status(200).json(new ApiResponse(200, result, "Details of short URL retrieved successfully"));
}

export {
    createShortUrl,
    redirectToOriginalUrl,
    detailsOfShortUrl
}