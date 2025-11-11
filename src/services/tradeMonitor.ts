import moment from 'moment';
import { ENV } from '../config/env';
import { UserActivityInterface, UserPositionInterface } from '../interfaces/User';
import { getUserActivityModel, getUserPositionModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';
import { monitoringService } from './monitoringService';

const USER_ADDRESS = ENV.USER_ADDRESS;
const TOO_OLD_TIMESTAMP = ENV.TOO_OLD_TIMESTAMP;
const FETCH_INTERVAL = ENV.FETCH_INTERVAL;

if (!USER_ADDRESS) {
    throw new Error('USER_ADDRESS is not defined');
}

const UserActivity = getUserActivityModel(USER_ADDRESS);
const UserPosition = getUserPositionModel(USER_ADDRESS);

let cachedTrades: UserActivityInterface[] = [];

const initialize = async () => {
    cachedTrades = (await UserActivity.find().exec()).map((trade) => trade as UserActivityInterface);
};

const fetchTradeData = async () => {
    try {
        // Query activities from Polymarket data API
        const activities: UserActivityInterface[] = await fetchData(
            `https://data-api.polymarket.com/activity?user=${USER_ADDRESS}`
        );

        // Extract only trade-type activities
        const trades = activities.filter(
            (activity) => activity.type === 'TRADE'
        );

        // Determine cutoff time for outdated trades
        const currentTime = Math.floor(Date.now() / 1000);
        const tooOldThreshold = currentTime - TOO_OLD_TIMESTAMP * 60 * 60; // Hours to seconds conversion

        // Iterate through each trade entry
        for (const trade of trades) {
            // Ignore outdated trades
            if (trade.timestamp < tooOldThreshold) {
                continue;
            }

            // Verify if trade exists in database
            const existingTrade = await UserActivity.findOne({
                transactionHash: trade.transactionHash,
            }).exec();

            if (!existingTrade) {
                // Store new trade record
                await UserActivity.create({
                    ...trade,
                    bot: false,
                    botExcutedTime: 0,
                });
                console.log(`Trade detected: ${trade.asset} ${trade.side} ${trade.size} @ ${trade.price}`);
                console.log(`Transaction hash: ${trade.transactionHash}`);
                
                // Register trade with monitoring
                monitoringService.logTradeDetected(trade);
            }
        }
    } catch (error) {
        console.error(`Failed to fetch trade data:`, error);
    }
};

const tradeMonitor = async () => {
    console.log(`Monitoring service active, checking every ${FETCH_INTERVAL} seconds`);
    await initialize();    // Load existing trades from database
    
    // Display statistics every 5 minutes
    setInterval(() => {
        monitoringService.printStats();
    }, 5 * 60 * 1000);
    
    while (true) {
        await fetchTradeData();     // Poll target wallet activities
        await new Promise((resolve) => setTimeout(resolve, FETCH_INTERVAL * 1000));     // Wait for next fetch cycle
    }
};

export default tradeMonitor;
