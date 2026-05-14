import { connect, StringCodec } from "nats";
import { UAParser } from "ua-parser-js";
import UrlVisit from "../models/urlVisit.model.js";
import Url from "../models/url.model.js";

const sc = StringCodec();

let natsClient = null;

export const startClickConsumer = async (natsUrl) => {
    natsClient = await connect({
        servers: natsUrl,
        reconnect: true,
    });

    console.log("Click consumer connected to NATS.");

    const sub = natsClient.subscribe("url.clicked", {
        queue: "click-workers",
    });

    for await (const msg of sub) {
        try {
            const event = JSON.parse(sc.decode(msg.data));

            const parser = new UAParser(event.userAgent || "");
            const ua = parser.getResult();

            await UrlVisit.create({
                urlId: event.urlId,
                ip: event.ip,
                userAgent: event.userAgent,
                referer: event.referer,
                language: event.language,
                browser: ua.browser?.name || "unknown",
                os: ua.os?.name || "unknown",
                deviceType: ua.device?.type || "desktop",
                clickedAt: new Date(event.ts),
            });

            try {
                const res = await Url.updateOne(
                    { _id: event.urlId },
                    { $inc: { clickCount: 1 } }
                );
            } catch (incErr) {
                console.error("Failed to increment clickCount:", incErr);
            }

            console.log("Click stored:", event.urlId);

        } catch (err) {
            console.error("Failed to process click:", err);
        }
    }
};

export const stopClickConsumer = async () => {
    if (!natsClient) return;
    try {
        await natsClient.drain();
        await natsClient.close();
        console.log("Click consumer NATS connection closed");
    } catch (err) {
        console.error("Error closing click consumer NATS client:", err);
    } finally {
        natsClient = null;
    }
};