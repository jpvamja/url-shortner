async function createShortUrlService(originalUrl, customUrl = null) {
    return {
        message : "URL shortened successfully",
    };
}

async function redirectToOriginalUrlService(shortUrl) {
    return {
        message : "Redirecting to original URL",
    };
}

async function detailsOfShortUrlService(shortUrl, query) {
    return {
        message : "Details of short URL",
    };
}

export {
    createShortUrlService,
    redirectToOriginalUrlService,
    detailsOfShortUrlService
}