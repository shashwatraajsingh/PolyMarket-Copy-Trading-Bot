import axios from 'axios';
import { ENV } from '../config/env';

const fetchData = async (url: string) => {
    try {
        const config: any = {
            timeout: 30000, // 30 second timeout
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        };

        // Configure proxy if environment variables are set
        if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
            const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
            console.log(`Proxy configured: ${proxyUrl}`);
            const proxyConfig = new URL(proxyUrl!);
            config.proxy = {
                protocol: proxyConfig.protocol.replace(':', ''),
                host: proxyConfig.hostname,
                port: parseInt(proxyConfig.port || '80'),
            };
        }

        const response = await axios.get(url, config);
        return response.data;
    } catch (error: any) {
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            console.error(`Connection timeout detected. Verify network connectivity or configure VPN/proxy.`);
        } else {
            console.error(`Data fetch error: ${error.message}`);
        }
        throw error;
    }
};

export default fetchData;
