import express from 'express';

import errorMiddleware from "./middlewares/error.middleware.js";
import ApiResponse from "./utils/apiResponse.js";

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use((req, res) => {
    res.status(404).json(new ApiResponse(404, null, "Route not found"));
});

app.use(errorMiddleware);

export default app;