import { connect, StringCodec } from "nats";

let natsClient = null;

const sc = StringCodec();

const connectNats = async (natsUrl) => {
    try {
        natsClient = await connect({
            servers: natsUrl,
            reconnect: true,
            maxReconnectAttempts: 10,
            reconnectTimeWait: 2000,
        });

        console.log(`Connected to NATS: ${natsClient.getServer()}`);

        natsClient.closed().then((err) => {
            if (err) {
                console.error("NATS closed with error:", err);
            } else {
                console.log("NATS connection closed");
            }
        });

        return natsClient;
    } catch (error) {
        console.error("NATS connection failed:", error);
        process.exit(1);
    }
};

const getNatsClient = () => {
    if (!natsClient) {
        throw new Error("NATS client not initialized");
    }

    return natsClient;
};

export { connectNats, getNatsClient, sc };