import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";

async function createShortUrl(req, res) {
    res.status(200).json(new ApiResponse(200, null, "api/v1/shortener endpoint is not implemented yet"));
}

async function redirectToOriginalUrl(req, res) {
    res.status(200).json(new ApiResponse(200, null, "api/v1/:shortUrl endpoint is not implemented yet"));
}

async function detailsOfShortUrl(req, res) {
    res.status(200).json(new ApiResponse(200, null, "api/v1/details/:shortUrl endpoint is not implemented yet"));
}

export {
    createShortUrl,
    redirectToOriginalUrl,
    detailsOfShortUrl
}
