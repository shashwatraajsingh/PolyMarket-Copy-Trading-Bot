import mongoose from 'mongoose';
import { ENV } from './env';

const databaseUri = ENV.MONGO_URI || 'mongodb://localhost:27017/polymarket_copytrading';

const connectDB = async () => {
    try {
        await mongoose.connect(databaseUri);
        console.log(`Database connection established`);
    } catch (error) {
        console.error(`Database connection failed:`, error);
        process.exit(1);
    }
};

export default connectDB;
