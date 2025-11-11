import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';
import { SignatureType } from '@polymarket/order-utils';
import { ENV } from '../config/env';

const PROXY_WALLET = ENV.PROXY_WALLET;
const PRIVATE_KEY = ENV.PRIVATE_KEY;
const CLOB_HTTP_URL = ENV.CLOB_HTTP_URL;

const createClobClient = async (): Promise<ClobClient> => {
    const chainId = 137;
    const host = CLOB_HTTP_URL as string;
    const wallet = new ethers.Wallet(PRIVATE_KEY as string);
    
    const originalConsoleError = console.error;
    console.error = function () {};
    const creds = await new ClobClient(host, chainId, wallet).createOrDeriveApiKey();
    console.error = originalConsoleError;
    console.log('API Key created/derived', creds);

    const clobClient = new ClobClient(
        host,
        chainId,
        wallet,
        creds,
        SignatureType.POLY_PROXY,
        PROXY_WALLET as string
    );
    console.log(clobClient);
    return clobClient;
};

export default createClobClient;
