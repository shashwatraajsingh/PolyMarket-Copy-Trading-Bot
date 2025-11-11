import { UserPositionInterface } from '../interfaces/User';
import getMyBalance from './getMyBalance';

/**
 * Compute total portfolio value including positions and USDC
 */
export const calculatePortfolioValue = async (
    wallet: string,
    positions: UserPositionInterface[]
): Promise<number> => {
    const usdcBalance = await getMyBalance(wallet);
    
    // Aggregate all position values
    const positionsValue = positions.reduce((total, position) => {
        return total + (position.currentValue || 0);
    }, 0);
    
    return usdcBalance + positionsValue;
};

/**
 * Determine position size as portfolio percentage
 */
export const calculatePositionPercentage = (
    positionValue: number,
    totalPortfolioValue: number
): number => {
    if (totalPortfolioValue === 0) return 0;
    return (positionValue / totalPortfolioValue) * 100;
};

/**
 * Validate if new trade breaches maximum position limit
 */
export const wouldExceedPositionLimit = (
    currentPositionValue: number,
    newTradeValue: number,
    totalPortfolioValue: number,
    maxPositionLimit: number
): boolean => {
    const projectedPositionValue = currentPositionValue + newTradeValue;
    const projectedPercentage = calculatePositionPercentage(projectedPositionValue, totalPortfolioValue);
    return projectedPercentage > maxPositionLimit;
};
