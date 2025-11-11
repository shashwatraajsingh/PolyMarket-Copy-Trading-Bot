import { ethers } from 'ethers';
import { ENV } from '../config/env';

const RPC_URL = ENV.RPC_URL;
const USDC_CONTRACT_ADDRESS = ENV.USDC_CONTRACT_ADDRESS;

const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

// Cache provider instance to avoid repeated network detection
let cachedProvider: ethers.providers.JsonRpcProvider | null = null;

const getProvider = (): ethers.providers.JsonRpcProvider => {
    if (!cachedProvider) {
        // Explicitly configure for Polygon network
        cachedProvider = new ethers.providers.JsonRpcProvider(
            {
                url: RPC_URL,
                timeout: 30000,
            },
            {
                name: 'polygon',
                chainId: 137,
            }
        );
    }
    return cachedProvider;
};

const getMyBalance = async (walletAddress: string): Promise<number> => {
    try {
        const provider = getProvider();
        const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
        const rawBalance = await usdcContract.balanceOf(walletAddress);
        const formattedBalance = ethers.utils.formatUnits(rawBalance, 6);
        return parseFloat(formattedBalance);
    } catch (error: any) {
        console.error(`Failed to fetch balance for ${walletAddress}:`, error.message);
        throw error;
    }
};

export default getMyBalance;
