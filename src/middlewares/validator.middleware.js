import ApiResponse from "../utils/apiResponse.js";

const sanitize = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(sanitize);
    }

    if (obj && typeof obj === "object") {
        const out = {};

        for (const [k, v] of Object.entries(obj)) {
            out[k] = sanitize(v === "" ? undefined : v);
        }

        return out;
    }

    return obj;
};

const validate = (schema, source) => {
    return async (req, res, next) => {
        const data = sanitize(req[source]);

        const result = await schema.safeParseAsync(data);

        if (!result.success) {
            return res.status(400).json(
                new ApiResponse(
                    400,
                    null,
                    "Validation Error",
                    result.error.flatten()
                )
            );
        }

        req[source] = result.data;

        next();
    };
};

const validateBody = (schema) =>
    validate(schema, "body");

const validateParams = (schema) =>
    validate(schema, "params");

const validateQuery = (schema) =>
    validate(schema, "query");

export {
    validateBody,
    validateParams,
    validateQuery
};