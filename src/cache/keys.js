export const CACHE_KEYS = {
    SHORT_URL: (code) => `short:url:${code}`,

    URL_ANALYTICS: (urlId) => `url:analytics:${urlId}`,

    CLICK_COUNT: (urlId) => `url:clicks:${urlId}`,

    BLOOM_SHORT_URL: "bloom:shorturl",
};