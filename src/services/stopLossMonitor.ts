import { ClobClient, OrderType, Side } from '@polymarket/clob-client';
import { ENV } from '../config/env';
import { UserPositionInterface } from '../interfaces/User';
import fetchData from '../utils/fetchData';
import { monitoringService } from './monitoringService';

const PROXY_WALLET = ENV.PROXY_WALLET;
const STOP_LOSS_PRICE = ENV.STOP_LOSS_PRICE;
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * Stop-loss monitor that independently checks positions and sells if price drops below threshold
 */
const stopLossMonitor = async (clobClient: ClobClient) => {
    console.log(`Stop-loss protection active: threshold $${STOP_LOSS_PRICE}, interval 30s`);

    const checkStopLoss = async () => {
        try {
            // Fetch current positions
            const positions: UserPositionInterface[] = await fetchData(
                `https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`
            );

            // Identify positions requiring stop-loss monitoring
            const activePositions = positions.filter(
                (position) => position.size > 0 && !position.redeemable
            );

            for (const position of activePositions) {
                // Evaluate if price breached stop-loss threshold
                if (position.curPrice < STOP_LOSS_PRICE) {
                    console.log(`\nSTOP-LOSS ALERT TRIGGERED`);
                    console.log(`Market: ${position.title}`);
                    console.log(`Outcome: ${position.outcome}`);
                    console.log(`Current price: $${position.curPrice}`);
                    console.log(`Stop-loss threshold: $${STOP_LOSS_PRICE}`);
                    console.log(`Position size: ${position.size}`);
                    console.log(`Initiating emergency sell...`);

                    try {
                        // Get order book to find best bid
                        const orderBook = await clobClient.getOrderBook(position.asset);

                        if (!orderBook.bids || orderBook.bids.length === 0) {
                            console.log(`No bids available, unable to execute stop-loss`);
                            monitoringService.logTradeFailed(
                                {
                                    asset: position.asset,
                                    side: 'SELL',
                                    size: position.size,
                                    price: position.curPrice,
                                    usdcSize: position.size * position.curPrice,
                                } as any,
                                'Stop-loss: No bids found'
                            );
                            continue;
                        }

                        // Find best bid price
                        const maxPriceBid = orderBook.bids.reduce((max: any, bid: any) => {
                            return parseFloat(bid.price) > parseFloat(max.price) ? bid : max;
                        }, orderBook.bids[0]);

                        let remaining = position.size;
                        let totalSold = 0;

                        // Execute sell in chunks if required
                        while (remaining > 0) {
                            const sellSize = Math.min(remaining, parseFloat(maxPriceBid.size));

                            const orderArgs = {
                                side: Side.SELL,
                                tokenID: position.asset,
                                amount: sellSize,
                                price: parseFloat(maxPriceBid.price),
                            };

                            console.log(`Selling ${sellSize} shares at $${maxPriceBid.price}`);

                            const signedOrder = await clobClient.createMarketOrder(orderArgs);
                            const resp = await clobClient.postOrder(signedOrder, OrderType.FOK);

                            if (resp.success === true) {
                                totalSold += sellSize;
                                remaining -= sellSize;
                                console.log(`Successfully sold ${sellSize} shares`);
                            } else {
                                console.log(`Sale failed:`, resp);
                                break;
                            }

                            // Update order book data if more remains
                            if (remaining > 0) {
                                await new Promise((resolve) => setTimeout(resolve, 1000));
                                const newOrderBook = await clobClient.getOrderBook(position.asset);
                                if (!newOrderBook.bids || newOrderBook.bids.length === 0) break;
                            }
                        }

                        if (totalSold > 0) {
                            console.log(`Stop-loss complete: Sold ${totalSold} of ${position.size} shares`);
                            monitoringService.logTradeExecuted(
                                {
                                    asset: position.asset,
                                    side: 'SELL',
                                    size: totalSold,
                                    price: parseFloat(maxPriceBid.price),
                                    usdcSize: totalSold * parseFloat(maxPriceBid.price),
                                } as any,
                                Date.now()
                            );
                        }
                    } catch (error: any) {
                        console.error(`Stop-loss execution error:`, error.message);
                        monitoringService.logTradeFailed(
                            {
                                asset: position.asset,
                                side: 'SELL',
                                size: position.size,
                                price: position.curPrice,
                                usdcSize: position.size * position.curPrice,
                            } as any,
                            `Stop-loss error: ${error.message}`
                        );
                    }
                }
            }
        } catch (error: any) {
            console.error(`Stop-loss monitor error:`, error.message);
        }
    };

    // Execute initial check immediately
    await checkStopLoss();

    // Schedule recurring checks
    setInterval(async () => {
        await checkStopLoss();
    }, CHECK_INTERVAL);
};

export default stopLossMonitor;
