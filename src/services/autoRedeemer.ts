import { ClobClient } from '@polymarket/clob-client';
import { ENV } from '../config/env';
import { UserPositionInterface } from '../interfaces/User';
import fetchData from '../utils/fetchData';

const PROXY_WALLET = ENV.PROXY_WALLET;
const REDEMPTION_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

/**
 * Auto-redemption service that checks for redeemable positions every 2 hours
 */
const autoRedeemer = async (clobClient: ClobClient) => {
    console.log(`Auto-Redemption Service started (runs every 2 hours)`);

    const checkAndRedeem = async () => {
        try {
            console.log(`\nChecking for redeemable positions............`);
            
            // Fetch all positions for the proxy wallet
            const positions: UserPositionInterface[] = await fetchData(
                `https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`
            );

            // Filter for redeemable positions
            const redeemablePositions = positions.filter(
                (position) => position.redeemable === true && position.size > 0
            );

            if (redeemablePositions.length === 0) {
                console.log(`No redeemable positions found`);
                return;
            }

            console.log(`Found ${redeemablePositions.length} redeemable position(s)`);

            // Process each redeemable position
            for (const position of redeemablePositions) {
                try {
                    console.log(`\nRedeeming position:`);
                    console.log(`Market: ${position.title}`);
                    console.log(`Outcome: ${position.outcome}`);
                    console.log(`Size: ${position.size}`);
                    console.log(`Value: $${position.currentValue}`);

                    // Note: The actual redemption method depends on the CLOB client API
                    // This is a placeholder - you'll need to verify the correct method
                    // Common methods might be:
                    // - clobClient.redeemPosition(position.asset)
                    // - clobClient.redeemWinnings(position.conditionId)
                    // - clobClient.settlePosition(position.asset)

                    // Check if CLOB client has redemption capability
                    if (typeof (clobClient as any).redeemPosition === 'function') {
                        const result = await (clobClient as any).redeemPosition(position.asset);
                        console.log(`Redeemed successfully:`, result);
                    } else if (typeof (clobClient as any).settlePosition === 'function') {
                        const result = await (clobClient as any).settlePosition(position.asset);
                        console.log(`Settled successfully:`, result);
                    } else {
                        console.log(`Redemption method not found in CLOB client`);
                        console.log(`Manual redemption required for asset: ${position.asset}`);
                        console.log(`Visit: https://polymarket.com/`);
                    }

                    // Wait a bit between redemptions to avoid rate limiting
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                } catch (error: any) {
                    console.error(`Failed to redeem position:`, error.message);
                }
            }

            console.log(`\nRedemption check completed\n`);
        } catch (error: any) {
            console.error(`Error in auto-redemption service:`, error.message);
        }
    };

    // Run immediately on start
    await checkAndRedeem();

    // Then run every 2 hours
    setInterval(async () => {
        await checkAndRedeem();
    }, REDEMPTION_INTERVAL);
};

export default autoRedeemer;
