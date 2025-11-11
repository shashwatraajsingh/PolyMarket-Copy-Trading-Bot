import { ethers } from 'ethers';
import { ENV } from '../config/env';

const RPC_URL = ENV.RPC_URL;
const USDC_CONTRACT_ADDRESS = ENV.USDC_CONTRACT_ADDRESS;

const USDC_ABI = ['function balanceOf(address owner) view returns (uint256)'];

const getMyBalance = async (walletAddress: string): Promise<number> => {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
    const rawBalance = await usdcContract.balanceOf(walletAddress);
    const formattedBalance = ethers.utils.formatUnits(rawBalance, 6);
    return parseFloat(formattedBalance);
};

export default getMyBalance;
