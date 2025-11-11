# Polymarket Copy Trading Bot

## What this bot does
- **Copy trades** from another wallet on Polymarket.
- **Place the same orders** for you with your proxy wallet.
- **Watch the trader all the time** so you do not miss new moves.
- **Keep safe rules** like stop loss, position limit, and minimum trade size.
- **Write activity reports** to JSON log files.

## What you need first
- Node.js 18+ and npm.
- Docker (if you want local MongoDB) or access to MongoDB Atlas.
- A Polymarket wallet with USDC to trade.
- Your target wallet address that you want to copy.

## Install step by step
1. **Clone or download** this project.
2. **Move into the folder**:
   ```bash
   cd polymarket_copy_trading_bot
   ```
3. **Install packages**:
   ```bash
   npm install
   ```
4. **Make a `.env` file** (copy from `CONFIG_GUIDE.md` if needed).
5. **Fill the `.env` file** with your own values. See the next section.
6. **Build the code**:
   ```bash
   npm run build
   ```
7. **Start the bot**:
   ```bash
   npm run start
   ```

## Important settings in `.env`
```
USER_ADDRESS = address you copy
PROXY_WALLET = your trading wallet
PRIVATE_KEY = private key for proxy wallet
CLOB_HTTP_URL = https://clob.polymarket.com/
CLOB_WS_URL = wss://ws-subscriptions-clob.polymarket.com/ws
FETCH_INTERVAL = 1              # seconds between checks
TOO_OLD_TIMESTAMP = 1           # ignore trades older than 1 hour
RETRY_LIMIT = 3                 # tries when posting an order
MONGO_URI = mongodb://localhost:27017/polymarket_copytrading
RPC_URL = your Polygon RPC URL
USDC_CONTRACT_ADDRESS = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
MINIMUM_USDC_THRESHOLD = 10     # skip trades smaller than $10
MAX_POSITION_LIMIT = 20         # never hold more than 20% in one market
STOP_LOSS_PRICE = 0.50          # sell if price drops below $0.50
```

## What the services do
- **tradeMonitor**: checks the target wallet every few seconds.
- **tradeExecutor**: copies trades to your wallet with safety checks.
- **autoRedeemer**: every 2 hours it redeems settled positions.
- **stopLossMonitor**: looks for prices under the stop-loss price and sells.
- **monitoringService**: saves stats to `logs/monitoring.json` and prints a report every 5 minutes.

## Logs and reports
- Real-time stats in `logs/monitoring.json`.
- Trade history (last 24h) in `logs/trade_logs.json`.
- Console shows summaries like:
  ```
  📊 ===== MONITORING STATS =====
  📈 Trades detected: 12
  📈 Trades executed: 11 (91.7%)
  �� Uptime: 2h 14m | Memory: 140MB | CPU: 2%
  ```

## Helpful tips
- If Polymarket is blocked in your region, use a VPN or set `HTTPS_PROXY` in `.env`.
- Keep your private key safe. Do not share the `.env` file.
- Start with small amounts to test the bot behavior.
- Read `CONFIG_GUIDE.md` and `FEATURES_SUMMARY.md` for more details.

Enjoy automated copy trading! 

Built by t.me/scionofindra
feel free to contribute in my wallet
