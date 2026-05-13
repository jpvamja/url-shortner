import mongoose from "mongoose";

const connectDB = async (mongoURL) => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected");
        });

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            console.warn("MongoDB disconnected");
        });

        await mongoose.connect(mongoURL, {
            minPoolSize: 10,
            maxPoolSize: 50,
            maxIdleTimeMS: 30000,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            retryWrites: true,
            retryReads: true,
        });

        console.log("Connected to MongoDB with optimized pool");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

export default connectDB;