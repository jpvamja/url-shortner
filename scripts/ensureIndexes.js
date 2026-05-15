import mongoose from 'mongoose';
import env from '../src/configs/env.js';

const ensure = async () => {
    try {
        await mongoose.connect(env.MONGODB_URL, { minPoolSize: 2, maxPoolSize: 5 });
        console.log('Connected to MongoDB, ensuring indexes...');

        const Url = (await import('../src/models/url.model.js')).default;
        const UrlVisit = (await import('../src/models/urlVisit.model.js')).default;

        await Url.init();
        await UrlVisit.init();

        console.log('Indexes ensured');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Failed to ensure indexes:', err);
        process.exit(1);
    }
};

ensure();
