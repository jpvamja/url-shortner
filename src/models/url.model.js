import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
    {
        originalUrl: {
            type: String,
            required: [true, "Original URL is required"],
            trim: true,
            validate: {
                validator: function (v) {
                    try {
                        new URL(v);
                        return true;
                    } catch {
                        return false;
                    }
                },
                message: "Invalid URL format",
            },
        },

        shortUrl: {
            type: String,
            required: [true, "Short URL is required"],
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 6,
            maxlength: 8,
            match: [
                /^[a-zA-Z0-9]+$/,
                "Short URL can only contain letters and numbers",
            ],
        },

        codeType: {
            type: String,
            enum: ["generated", "custom"],
            required: true,
        },

        clickCount: {
            type: Number,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Url = mongoose.model("Url", urlSchema);

export default Url;