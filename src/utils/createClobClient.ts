import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { ENV } from '../config/env';

const PROXY_WALLET = ENV.PROXY_WALLET;
const PRIVATE_KEY = ENV.PRIVATE_KEY;
const CLOB_HTTP_URL = ENV.CLOB_HTTP_URL;

const createClobClient = async (): Promise<ClobClient> => {
    const polygonChainId = 137;
    const apiHost = CLOB_HTTP_URL as string;
    const signerWallet = new ethers.Wallet(PRIVATE_KEY as string);
    
    const originalErrorLog = console.error;
    console.error = function () {};
    const apiCredentials = await new ClobClient(apiHost, polygonChainId, signerWallet).createOrDeriveApiKey();
    console.error = originalErrorLog;
    console.log(`API credentials generated:`, apiCredentials);

    const clientInstance = new ClobClient(
        apiHost,
        polygonChainId,
        signerWallet,
        apiCredentials,
        SignatureType.POLY_GNOSIS_SAFE,
        PROXY_WALLET as string
    );
    console.log(`CLOB client initialized:`, clientInstance);
    return clientInstance;
};

export default createClobClient;
