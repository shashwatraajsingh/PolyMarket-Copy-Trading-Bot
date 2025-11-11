import connectDB from './config/db';
import { ENV } from './config/env';
import createClobClient from './utils/createClobClient';
import tradeExecutor from './services/tradeExecutor';
import tradeMonitor from './services/tradeMonitor';
import autoRedeemer from './services/autoRedeemer';
import stopLossMonitor from './services/stopLossMonitor';
import test from './test/test';

const USER_ADDRESS = ENV.USER_ADDRESS;
const PROXY_WALLET = ENV.PROXY_WALLET;

export const main = async () => {
    await connectDB();
    console.log(`Target wallet address: ${USER_ADDRESS}`);
    console.log(`Bot wallet address: ${PROXY_WALLET}`);
    const clobClient = await createClobClient();
    tradeMonitor();  // Start monitoring target wallet activity
    tradeExecutor(clobClient);  // Begin copy trading execution
    autoRedeemer(clobClient);  // Launch auto-redemption service
    stopLossMonitor(clobClient);  // Activate stop-loss protection
    // test(clobClient);
};

main();
