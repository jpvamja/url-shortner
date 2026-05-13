import app from "./app.js";

let server;

const start = async () => {
    try {
        server = app.listen(8000, () => {
            console.log(`Server running on port 8000`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

start();