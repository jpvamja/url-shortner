import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

import { getNatsClient, sc } from "../configs/nats.js";

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

    if (!result) {
        throw new ApiError(404, "URL not found");
    }

    try {
        const natsClient = getNatsClient();

        const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress;

        const clickEvent = {
            urlId: result._id.toString(),
            ip,
            userAgent: req.headers["user-agent"] || "",
            referer: req.headers["referer"] || null,
            language: req.headers["accept-language"] || null,
            ts: Date.now(),
        };

        if (natsClient) {
            natsClient.publish("url.clicked", sc.encode(JSON.stringify(clickEvent))
            );
        }

    } catch (error) {
        console.error("NATS publish failed:", error.message);
    }

    return res.redirect(302, result.originalUrl);
}

async function detailsOfShortUrl(req, res) {
    const { shortUrl } = req.params;

    const result = await detailsOfShortUrlService(shortUrl, req.query);
    res.status(200).json(new ApiResponse(200, result, "URL details retrieved successfully"));
}

export {
    createShortUrl,
    redirectToOriginalUrl,
    detailsOfShortUrl
}