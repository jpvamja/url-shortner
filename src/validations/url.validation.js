import { z } from "zod";

const createShortUrlSchema = z.object({
    originalUrl: z
        .string()
        .url("Invalid URL format")
        .min(5, "URL must be at least 5 characters"),
    customUrl: z
        .string()
        .min(6, "Custom URL must be at least 6 characters")
        .max(8, "Custom URL must not exceed 8 characters")
        .regex(/^[a-zA-Z0-9]*$/, "Custom URL can only contain letters and numbers")
        .optional(),
});

const redirectToOriginalUrlSchema = z.object({
    shortUrl: z
        .string()
        .min(6, "Short code must be at least 6 characters")
        .max(8, "Short code must not exceed 8 characters")
        .regex(/^[a-zA-Z0-9]*$/, "Invalid short code format"),
});

const shortUrlDetailsSchema = z.object({
    shortUrl: z
        .string()
        .min(6, "Short code must be at least 6 characters")
        .max(8, "Short code must not exceed 8 characters")
        .regex(/^[a-zA-Z0-9]*$/, "Invalid short code format"),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export {
    createShortUrlSchema,
    redirectToOriginalUrlSchema,
    shortUrlDetailsSchema,
    paginationSchema,
};
