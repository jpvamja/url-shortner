import express from "express";

const router = express.Router();

router.get(
    "/home",
    async (req, res) => {
        res.send("Welcome to the URL Shortener API!");
    }
);

export default router;