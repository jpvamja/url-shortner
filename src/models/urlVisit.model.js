import mongoose from "mongoose";

const urlVisitSchema = new mongoose.Schema(
    {
        urlId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Url",
            required: true,
        },

        ip: {
            type: String,
        },

        country: {
            type: String,
        },

        browser: {
            type: String,
        },

        os: {
            type: String,
        },

        deviceType: {
            type: String,
        },

        userAgent: {
            type: String,
        },

        referer: {
            type: String,
        },

        language: {
            type: String,
        },

        clickedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: false,
    }
);

const UrlVisit = mongoose.model( "UrlVisit", urlVisitSchema );

export default UrlVisit;