import express from "express";

import urlRoutes from "./url.routes.js";

import env from "../configs/env.js";

const router = express.Router();

router.use(env.API_PREFIX, urlRoutes);

export default router;