import { ClobClient } from '@polymarket/clob-client';
import { UserActivityInterface, UserPositionInterface } from '../interfaces/User';
import { ENV } from '../config/env';
import { getUserActivityModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';
import spinner from '../utils/spinner';
import getMyBalance from '../utils/getMyBalance';
import postOrder from '../utils/postOrder';
import { monitoringService } from './monitoringService';
import { calculatePortfolioValue, wouldExceedPositionLimit } from '../utils/calculatePortfolioValue';

const USER_ADDRESS = ENV.USER_ADDRESS;
const RETRY_LIMIT = ENV.RETRY_LIMIT;
const PROXY_WALLET = ENV.PROXY_WALLET;
const MINIMUM_USDC_THRESHOLD = ENV.MINIMUM_USDC_THRESHOLD;
const MAX_POSITION_LIMIT = ENV.MAX_POSITION_LIMIT;

let pendingTrades: UserActivityInterface[] = [];

const UserActivity = getUserActivityModel(USER_ADDRESS);

const loadPendingTrades = async () => {
    pendingTrades = (
        await UserActivity.find({
            $and: [{ type: 'TRADE' }, { bot: false }, { botExcutedTime: { $lt: RETRY_LIMIT } }],
        }).exec()
    ).map((trade) => trade as UserActivityInterface);
};

const executeTrades = async (clobClient: ClobClient) => {
    for (const trade of pendingTrades) {
        const executionStart = Date.now();
        try {
            // Verify minimum trade value threshold
            if (trade.usdcSize < MINIMUM_USDC_THRESHOLD) {
                console.log(`SKIPPED: Trade value $${trade.usdcSize} below threshold $${MINIMUM_USDC_THRESHOLD}`);
                await UserActivity.updateOne({ _id: trade._id }, { bot: true });
                monitoringService.logTradeSkipped(trade, `Below minimum threshold ($${MINIMUM_USDC_THRESHOLD})`);
                continue;
            }
            
            console.log(`Preparing to copy trade:`, trade);
            // const market = await clobClient.getMarket(trade.conditionId);
            const botPositions: UserPositionInterface[] = await fetchData(
                `https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`
            );
            const targetPositions: UserPositionInterface[] = await fetchData(
                `https://data-api.polymarket.com/positions?user=${USER_ADDRESS}`
            );
            const botPosition = botPositions.find(
                (position: UserPositionInterface) => position.conditionId === trade.conditionId
            );
            const targetPosition = targetPositions.find(
                (position: UserPositionInterface) => position.conditionId === trade.conditionId
            );
            const botBalance = await getMyBalance(PROXY_WALLET);
            const targetBalance = await getMyBalance(USER_ADDRESS);
            console.log(`Bot wallet balance: ${botBalance}`);
            console.log(`Target wallet balance: ${targetBalance}`);
            
            // Validate position concentration limit
            const totalPortfolioValue = await calculatePortfolioValue(PROXY_WALLET, botPositions);
            const currentPositionValue = botPosition?.currentValue || 0;
            const balanceRatio = botBalance / (targetBalance + trade.usdcSize);
            const proposedTradeValue = trade.usdcSize * balanceRatio;
            
            if (wouldExceedPositionLimit(currentPositionValue, proposedTradeValue, totalPortfolioValue, MAX_POSITION_LIMIT)) {
                const currentPct = ((currentPositionValue / totalPortfolioValue) * 100).toFixed(1);
                const projectedPct = (((currentPositionValue + proposedTradeValue) / totalPortfolioValue) * 100).toFixed(1);
                console.log(`SKIPPED: Position limit check failed ${currentPct}% -> ${projectedPct}% (max ${MAX_POSITION_LIMIT}%)`);
                await UserActivity.updateOne({ _id: trade._id }, { bot: true });
                monitoringService.logTradeSkipped(trade, `Would exceed max position limit (${MAX_POSITION_LIMIT}%)`);
                continue;
            }
            
            const executionDuration = Date.now() - executionStart;
            monitoringService.logTradeExecuted(trade, executionDuration);
        } catch (error: any) {
            monitoringService.logTradeFailed(trade, error.message || 'Unknown error');
            console.error(`Trade execution failed:`, error);
        }
    }
};

const tradeExcutor = async (clobClient: ClobClient) => {
    console.log(`Copy trading executor initialized`);

    while (true) {
        await loadPendingTrades();
        if (pendingTrades.length > 0) {
            console.log(`Processing ${pendingTrades.length} pending trade(s)`);
            spinner.stop();
            await executeTrades(clobClient);
        } else {
            spinner.start('Monitoring for new trades');
        }
    }
};

export default tradeExcutor;
