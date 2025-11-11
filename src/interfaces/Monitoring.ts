export interface MonitoringStats {
    tradingActivity: {
        last24h: {
            tradesDetected: number;
            tradesExecuted: number;
            tradesFailed: number;
            tradesSkipped: number;
            successRate: string;
            averageExecutionTime: string;
            mostCommonError: string;
        };
    };
    botHealth: {
        status: 'RUNNING' | 'STOPPED' | 'ERROR';
        uptime: string;
        memoryUsage: string;
        cpuUsage: string;
        lastActivity: string;
    };
    errors: Array<{
        timestamp: number;
        type: string;
        message: string;
        count: number;
    }>;
    lastUpdated: number;
}

export interface TradeLog {
    timestamp: number;
    type: 'DETECTED' | 'EXECUTED' | 'FAILED' | 'SKIPPED';
    reason?: string;
    executionTime?: number;
    trade?: {
        asset: string;
        side: string;
        size: number;
        price: number;
        usdcSize: number;
    };
}
