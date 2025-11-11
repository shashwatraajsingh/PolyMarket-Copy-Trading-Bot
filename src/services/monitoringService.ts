import fs from 'fs';
import path from 'path';
import { MonitoringStats, TradeLog } from '../interfaces/Monitoring';

class MonitoringService {
    private stats: MonitoringStats;
    private tradeLogs: TradeLog[] = [];
    private errorCounts: Map<string, { count: number; message: string }> = new Map();
    private startTime: number;
    private logsDir: string;
    private statsFile: string;
    private tradeLogsFile: string;

    constructor() {
        this.startTime = Date.now();
        this.logsDir = path.join(process.cwd(), 'logs');
        this.statsFile = path.join(this.logsDir, 'monitoring.json');
        this.tradeLogsFile = path.join(this.logsDir, 'trade_logs.json');

        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        this.stats = {
            tradingActivity: {
                last24h: {
                    tradesDetected: 0,
                    tradesExecuted: 0,
                    tradesFailed: 0,
                    tradesSkipped: 0,
                    successRate: '0%',
                    averageExecutionTime: '0s',
                    mostCommonError: 'None',
                },
            },
            botHealth: {
                status: 'RUNNING',
                uptime: '0s',
                memoryUsage: '0MB',
                cpuUsage: '0%',
                lastActivity: 'Just started',
            },
            errors: [],
            lastUpdated: Date.now(),
        };

        // Load existing stats if available
        this.loadStats();

        // Auto-save every 30 seconds
        setInterval(() => this.saveStats(), 30000);
    }

    private loadStats() {
        try {
            if (fs.existsSync(this.statsFile)) {
                const data = fs.readFileSync(this.statsFile, 'utf-8');
                const loaded = JSON.parse(data);
                // Merge with defaults to handle new fields
                this.stats = { ...this.stats, ...loaded };
                this.stats.botHealth.status = 'RUNNING';
            }
            if (fs.existsSync(this.tradeLogsFile)) {
                const data = fs.readFileSync(this.tradeLogsFile, 'utf-8');
                this.tradeLogs = JSON.parse(data);
                // Keep only last 24 hours
                this.cleanOldLogs();
            }
        } catch (error) {
            console.error('Error loading monitoring stats:', error);
        }
    }

    private saveStats() {
        try {
            this.updateStats();
            fs.writeFileSync(this.statsFile, JSON.stringify(this.stats, null, 2));
            fs.writeFileSync(this.tradeLogsFile, JSON.stringify(this.tradeLogs, null, 2));
        } catch (error) {
            console.error('Error saving monitoring stats:', error);
        }
    }

    private cleanOldLogs() {
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.tradeLogs = this.tradeLogs.filter((log) => log.timestamp > twentyFourHoursAgo);
    }

    private updateStats() {
        this.cleanOldLogs();

        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentLogs = this.tradeLogs.filter((log) => log.timestamp > twentyFourHoursAgo);

        const detected = recentLogs.filter((log) => log.type === 'DETECTED').length;
        const executed = recentLogs.filter((log) => log.type === 'EXECUTED').length;
        const failed = recentLogs.filter((log) => log.type === 'FAILED').length;
        const skipped = recentLogs.filter((log) => log.type === 'SKIPPED').length;

        const successRate = detected > 0 ? ((executed / detected) * 100).toFixed(1) : '0';

        const executionTimes = recentLogs
            .filter((log) => log.executionTime)
            .map((log) => log.executionTime!);
        const avgTime =
            executionTimes.length > 0
                ? (executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length / 1000).toFixed(1)
                : '0';

        // Find most common error
        const errorMap = new Map<string, number>();
        recentLogs
            .filter((log) => log.type === 'FAILED' && log.reason)
            .forEach((log) => {
                const count = errorMap.get(log.reason!) || 0;
                errorMap.set(log.reason!, count + 1);
            });

        let mostCommonError = 'None';
        let maxCount = 0;
        errorMap.forEach((count, error) => {
            if (count > maxCount) {
                maxCount = count;
                mostCommonError = error;
            }
        });

        this.stats.tradingActivity.last24h = {
            tradesDetected: detected,
            tradesExecuted: executed,
            tradesFailed: failed,
            tradesSkipped: skipped,
            successRate: `${successRate}%`,
            averageExecutionTime: `${avgTime}s`,
            mostCommonError,
        };

        // Update bot health
        const uptime = Date.now() - this.startTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        this.stats.botHealth.uptime = `${hours}h ${minutes}m`;

        const memUsage = process.memoryUsage();
        this.stats.botHealth.memoryUsage = `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`;

        this.stats.botHealth.cpuUsage = `${process.cpuUsage().user}%`;

        const lastLog = this.tradeLogs[this.tradeLogs.length - 1];
        if (lastLog) {
            const secondsAgo = Math.floor((Date.now() - lastLog.timestamp) / 1000);
            this.stats.botHealth.lastActivity =
                secondsAgo < 60 ? `${secondsAgo} seconds ago` : `${Math.floor(secondsAgo / 60)} minutes ago`;
        }

        this.stats.lastUpdated = Date.now();
    }

    logTradeDetected(trade: any) {
        this.tradeLogs.push({
            timestamp: Date.now(),
            type: 'DETECTED',
            trade: {
                asset: trade.asset,
                side: trade.side,
                size: trade.size,
                price: trade.price,
                usdcSize: trade.usdcSize,
            },
        });
        this.stats.botHealth.lastActivity = 'Just now';
    }

    logTradeExecuted(trade: any, executionTime: number) {
        this.tradeLogs.push({
            timestamp: Date.now(),
            type: 'EXECUTED',
            executionTime,
            trade: {
                asset: trade.asset,
                side: trade.side,
                size: trade.size,
                price: trade.price,
                usdcSize: trade.usdcSize,
            },
        });
        this.stats.botHealth.lastActivity = 'Just now';
    }

    logTradeFailed(trade: any, reason: string) {
        this.tradeLogs.push({
            timestamp: Date.now(),
            type: 'FAILED',
            reason,
            trade: {
                asset: trade.asset,
                side: trade.side,
                size: trade.size,
                price: trade.price,
                usdcSize: trade.usdcSize,
            },
        });
        this.stats.botHealth.lastActivity = 'Just now';

        // Track error
        const existing = this.errorCounts.get(reason);
        if (existing) {
            existing.count++;
        } else {
            this.errorCounts.set(reason, { count: 1, message: reason });
        }
    }

    logTradeSkipped(trade: any, reason: string) {
        this.tradeLogs.push({
            timestamp: Date.now(),
            type: 'SKIPPED',
            reason,
            trade: {
                asset: trade.asset,
                side: trade.side,
                size: trade.size,
                price: trade.price,
                usdcSize: trade.usdcSize,
            },
        });
        this.stats.botHealth.lastActivity = 'Just now';
    }

    setStatus(status: 'RUNNING' | 'STOPPED' | 'ERROR') {
        this.stats.botHealth.status = status;
        this.saveStats();
    }

    getStats(): MonitoringStats {
        this.updateStats();
        return this.stats;
    }

    printStats() {
        this.updateStats();
        console.log('\n===== MONITORING REPORT =====');
        console.log('\nTrading Activity (Last 24h):');
        console.log(`Trades detected: ${this.stats.tradingActivity.last24h.tradesDetected}`);
        console.log(
            `Trades executed: ${this.stats.tradingActivity.last24h.tradesExecuted} (${this.stats.tradingActivity.last24h.successRate})`
        );
        console.log(`Failed: ${this.stats.tradingActivity.last24h.tradesFailed}`);
        console.log(`Skipped: ${this.stats.tradingActivity.last24h.tradesSkipped}`);
        console.log(`Average execution time: ${this.stats.tradingActivity.last24h.averageExecutionTime}`);
        console.log(`Most common error: "${this.stats.tradingActivity.last24h.mostCommonError}"`);

        console.log('\nBot Health Status:');
        console.log(
            `Status: ${this.stats.botHealth.status}${this.stats.botHealth.status === 'RUNNING' ? ' [ACTIVE]' : ' [INACTIVE]'}`
        );
        console.log(`Uptime: ${this.stats.botHealth.uptime}`);
        console.log(`Memory usage: ${this.stats.botHealth.memoryUsage}`);
        console.log(`CPU usage: ${this.stats.botHealth.cpuUsage}`);
        console.log(`Last activity: ${this.stats.botHealth.lastActivity}`);
        console.log('\n=============================\n');
    }
}

// Singleton instance
export const monitoringService = new MonitoringService();
