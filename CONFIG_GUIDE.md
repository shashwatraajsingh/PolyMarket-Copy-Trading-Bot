# Configuration Guide

## New Features Configuration

Add these lines to your `.env` file:

```bash
# Core Connectivity
RPC_URL = https://polygon-rpc.com       # REQUIRED. Replace with a reliable Polygon RPC endpoint
USDC_CONTRACT_ADDRESS = 0x...           # REQUIRED. Polygon USDC contract for balance checks

# Risk Management Settings
MINIMUM_USDC_THRESHOLD = 10          # Skip trades worth less than $10
MAX_POSITION_LIMIT = 20              # Max 20% of portfolio per market
STOP_LOSS_PRICE = 0.50               # Auto-sell if price drops below $0.50

# Optional: Proxy Settings (if Polymarket is blocked)
# HTTP_PROXY = http://proxy-server:port
# HTTPS_PROXY = http://proxy-server:port
```

## Feature Descriptions

### 1. Monitoring Logs (✅ Implemented)
- **Location**: `logs/monitoring.json` and `logs/trade_logs.json`
- **Updates**: Every 30 seconds
- **Console Output**: Every 5 minutes
- **Tracks**:
  - Trades detected/executed/failed/skipped
  - Success rate and average execution time
  - Bot health (uptime, memory, CPU)
  - Most common errors

### 2. MINIMUM_USDC_THRESHOLD (✅ Implemented)
- **Default**: $10
- **Purpose**: Skip small trades that aren't worth copying
- **Example**:
  - Trader buys $1 worth → ❌ SKIP
  - Trader buys $50 worth → ✅ COPY

### 3. MAX_POSITION_LIMIT (✅ Implemented)
- **Default**: 20%
- **Purpose**: Never exceed X% of portfolio in a single market
- **Calculation**: (Position Value / Total Portfolio) × 100
- **Action**: Skips trade if it would exceed limit

### 4. Auto-Redemption (✅ Implemented)
- **Frequency**: Every 2 hours
- **Purpose**: Automatically redeem resolved positions
- **Process**:
  1. Checks all positions for `redeemable = true`
  2. Attempts to redeem via CLOB client
  3. Converts winning shares to USDC

⚠️ **Note**: Redemption depends on CLOB client API support

### 5. Stop-Loss Monitor (✅ Implemented)
- **Default**: $0.50
- **Frequency**: Every 30 seconds
- **Purpose**: Independent protection from price drops
- **Action**: Automatically sells entire position if price < threshold
- **Override**: Works independently of copy-trading logic

## Monitoring Stats Example

```
📊 ===== MONITORING STATS =====

📈 Trading Activity (Last 24h):
├─ Trades detected: 127
├─ Trades executed: 123 (96.9%)
├─ Failed: 4
├─ Skipped: 0
├─ Average time: 2.3 seconds
└─ Most common error: "No bids found"

🤖 Bot Health Check:
├─ Status: RUNNING✅
├─ Uptime: 24h 12m
├─ Memory: 145MB
├─ CPU: 2%
└─ Last activity: 2 seconds ago

==============================
```

## Files Created

- `logs/monitoring.json` - Real-time monitoring statistics
- `logs/trade_logs.json` - Detailed trade history (last 24h)
- `src/services/monitoringService.ts` - Monitoring service
- `src/services/autoRedeemer.ts` - Auto-redemption service
- `src/services/stopLossMonitor.ts` - Stop-loss monitoring
- `src/utils/calculatePortfolioValue.ts` - Portfolio calculations
- `src/interfaces/Monitoring.ts` - Monitoring interfaces

## How to Use

1. **Update your `.env` file** with the new settings
2. **Rebuild**: `npm run build`
3. **Start bot**: `npm run start`
4. **Check logs**: View `logs/monitoring.json` for real-time stats
5. **Monitor console**: Stats printed every 5 minutes

## Recommended Settings

### Conservative (Low Risk)
```bash
MINIMUM_USDC_THRESHOLD = 50
MAX_POSITION_LIMIT = 10
STOP_LOSS_PRICE = 0.60
```

### Moderate (Balanced)
```bash
MINIMUM_USDC_THRESHOLD = 20
MAX_POSITION_LIMIT = 20
STOP_LOSS_PRICE = 0.50
```

### Aggressive (High Risk)
```bash
MINIMUM_USDC_THRESHOLD = 5
MAX_POSITION_LIMIT = 30
STOP_LOSS_PRICE = 0.40
```

## Troubleshooting

### Network Issues
If you see `ETIMEDOUT` errors:
1. Use a VPN (recommended)
2. Or set proxy in `.env`:
   ```bash
   HTTPS_PROXY=http://your-proxy:port
   ```

### Redemption Not Working
- CLOB client may not have redemption API
- Check console for manual redemption instructions
- Visit Polymarket website to redeem manually

### Stop-Loss Not Triggering
- Ensure positions have valid `curPrice` data
- Check that `STOP_LOSS_PRICE` is set correctly
- Monitor runs every 30 seconds (may have slight delay)
