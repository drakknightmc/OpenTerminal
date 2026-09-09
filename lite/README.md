# OpenTerminal Lite

A Bloomberg-style financial terminal with a Svelte frontend and Bun TypeScript backend. Supports real portfolio data from external brokers (ICICI Direct, IBKR, Groww), manual holdings entry, and live market data across US equities, crypto, forex, India equities, and macro indicators.

**Live**: https://terminal.drak.work (vault-pi, requires Tailscale VPN or Cloudflare Access)

---

## Architecture

### Design Overview

```
Browser (Svelte 4 SPA)
    ↓ HTTP/JSON
Bun Server (TypeScript, single binary)
    ├→ Route handlers (/api/market, /api/crypto, /api/portfolio, etc.)
    ├→ In-memory cache layer (with stale fallback for provider outages)
    ├→ Provider abstraction (external API calls with fallback chains)
    ├→ Portfolio engine (SQLite + external DB reader)
    └→ AI chat (Anthropic Claude, optional via ANTHROPIC_API_KEY)
    
    Database: SQLite (lite/data/openterminal-lite.db)
    External DB: PORTFOLIO_DB_PATH (read-only, symlink to broker database)
```

### Directory Structure

```
lite/
├── server/                          # Bun TypeScript server
│   ├── src/
│   │   ├── index.ts                 # HTTP server, routes, static serving
│   │   ├── cache.ts                 # Two-tier cache (live + stale)
│   │   ├── db.ts                    # SQLite initialization
│   │   ├── portfolio/               # Net worth, holdings, transactions
│   │   │   ├── schema.ts            # Database schema
│   │   │   ├── store.ts             # Add/get holdings, weighted-avg cost
│   │   │   ├── networth.ts          # Compute net worth with FX conversion
│   │   │   ├── externalDb.ts        # Read broker imports (read-only)
│   │   │   └── index.ts             # Exports
│   │   ├── providers/               # External data fetching
│   │   │   ├── us/                  # US equities (Nasdaq → Yahoo → Stooq)
│   │   │   ├── crypto/              # Crypto (Binance, CoinGecko)
│   │   │   ├── fx/                  # FX rates (Frankfurter, exchangerate-api)
│   │   │   ├── india/               # India market (NSE, Yahoo India)
│   │   │   ├── mutualfunds/         # Mutual funds (AMFI via mfapi.in)
│   │   │   ├── macro/               # US Treasuries, VIX (FRED, TradingView)
│   │   │   └── news/                # News (RSS feeds)
│   │   └── routes/                  # /api/* handlers
│   │       ├── portfolio.ts         # Holdings, transactions, net worth
│   │       ├── market.ts            # US quotes, candles, options, screener
│   │       ├── crypto.ts            # Crypto quotes, OHLCV, dominance
│   │       ├── fx.ts                # FX rates
│   │       ├── india.ts             # India indices, quotes, candles
│   │       ├── mf.ts                # Mutual fund NAV, search
│   │       ├── macro.ts             # Treasuries, VIX
│   │       ├── news.ts              # News feed
│   │       ├── ai.ts                # Claude chat (if ANTHROPIC_API_KEY set)
│   │       └── _utils.ts            # Shared helpers, TTL constants
│   ├── tsconfig.json
│   ├── package.json
│   └── Bun.build config (embedded in src/index.ts)
│
├── web/                             # Svelte SPA (Vite)
│   ├── src/
│   │   ├── main.ts                  # Entry point
│   │   ├── App.svelte               # Root layout
│   │   ├── store/
│   │   │   └── widgets.ts           # Svelte store: widget list, layout, active symbol
│   │   ├── components/
│   │   │   ├── TopBar.svelte        # Header: logo, market status, search button
│   │   │   └── Sidebar.svelte       # Left panel: add widget menu, keyboard shortcuts
│   │   ├── widgets/                 # Individual widget components (13 types)
│   │   │   ├── WorkspaceGrid.svelte # GridStack layout manager (main UI)
│   │   │   ├── Chart.svelte         # OHLC chart (lightweight-charts + indicators)
│   │   │   ├── Quote.svelte         # Stock quote snapshot
│   │   │   ├── News.svelte          # News feed
│   │   │   ├── Watchlist.svelte     # Watch list manager
│   │   │   ├── Crypto.svelte        # Crypto assets table + chart
│   │   │   ├── Options.svelte       # Options chain
│   │   │   ├── Portfolio.svelte     # Holdings, add transactions, net worth
│   │   │   ├── IndiaMarket.svelte   # India indices + quote search
│   │   │   ├── MutualFund.svelte    # Mutual fund NAV search + history
│   │   │   ├── Macro.svelte         # Treasury yield curve, VIX
│   │   │   ├── Screener.svelte      # Stock screener
│   │   │   ├── Heatmap.svelte       # Market heatmap (sector performance)
│   │   │   ├── AiAssistant.svelte   # Chat with Claude
│   │   │   └── CommandPalette.svelte # Global search (Ctrl+K)
│   │   └── lib/
│   │       ├── format.ts            # Shared formatters (price, number, currency)
│   │       └── indicators.ts        # Technical analysis (SMA, EMA, RSI, MACD, etc.)
│   ├── tsconfig.json
│   ├── package.json
│   └── vite.config.ts
│
├── dev.sh                           # Start both servers in parallel (watch mode)
├── package.json                     # Root workspace
└── data/                            # SQLite files (created on first run)
    └── openterminal-lite.db         # Main database
```

### Technology Stack

- **Server**: Bun 1.x (TypeScript, single-binary compilation)
- **Web**: Svelte 4 + Vite 5
- **Charting**: Lightweight Charts 5.x
- **Grid Layout**: GridStack 11.3.0
- **Database**: SQLite 3 with WAL mode
- **Build**: Bun (both server and web)
- **Package Manager**: Bun

---

## Setup

### Prerequisites

- **Bun** 1.0+ ([install](https://bun.sh))
- **Node.js** 18+ (for web dev tooling, Bun includes this)
- Optional: **ANTHROPIC_API_KEY** for AI assistant (Claude via Anthropic SDK)

### Development

```bash
cd lite
./dev.sh
```

This starts:
- **Backend**: http://localhost:4100 (auto-reload on TypeScript changes)
- **Frontend**: http://localhost:5173 (auto-reload on Svelte changes)

Bun watches both `server/src` and `web/src` for changes.

### Production Build

```bash
cd lite
bun run build                # Build web + server
bun run build:binary         # Output: server/dist/terminal (single executable)
```

Run the binary:
```bash
./server/dist/terminal       # Listens on $PORT (default 4100)
```

Environment variables:
- `PORT`: Server port (default 4100)
- `HOST`: Bind address (default 0.0.0.0)
- `NODE_ENV`: Set to `production` to serve static frontend
- `DB_PATH`: SQLite database path (default ./data/openterminal-lite.db)
- `PORTFOLIO_DB_PATH`: Path to external portfolio database (symlink or direct path)
- `ANTHROPIC_API_KEY`: Claude API key (optional, AI assistant disabled if unset)

### Database Setup

The SQLite database is **created automatically** on first run with:
- `holdings` table (market, symbol, currency, quantity, avg_cost)
- `transactions` table (buy/sell records with weighted-avg cost tracking)

To import external broker data:
1. Export holdings from broker (CSV or their database export)
2. Create a read-only SQLite database with schema matching `externalDb.ts` (columns: rowid, source, market, symbol, shares, avg_cost, last_price, currency, market_value, updated_at)
3. Set `PORTFOLIO_DB_PATH` to this database's path (can be a symlink)
4. Server reads it on-demand; no write access

---

## Widget System

### Adding a New Widget

1. **Create component**: `web/src/widgets/MyWidget.svelte`
   ```svelte
   <script lang="ts">
     export let symbol: string | undefined = undefined;
     // Implement your widget
   </script>
   <div>...</div>
   ```

2. **Add type**: Edit `web/src/store/widgets.ts`
   ```typescript
   export type WidgetType = "chart" | "quote" | ... | "mywidget";  // Add here
   ```

3. **Register component**: Edit `web/src/widgets/WorkspaceGrid.svelte`
   ```typescript
   // Line ~26: Add to WIDGET_LABELS
   const WIDGET_LABELS: Record<string, string> = {
     // ...
     mywidget: "My Widget",
   };

   // Line ~86: Add import at top
   import MyWidget from "./MyWidget.svelte";

   // Line ~101: Add case in createComponent()
   if (type === "mywidget") return new MyWidget({ target, props });
   ```

4. **Add to sidebar** (optional): Edit `web/src/components/Sidebar.svelte`
   ```typescript
   const ITEMS: SidebarItem[] = [
     // ...
     { type: "mywidget", label: "MY WIDGET", key: "" },
   ];
   ```

5. **Add API route** (if needed): Create `server/src/routes/myroute.ts`, register in `index.ts`

### Widget API Conventions

- **Fetch from server**: Use `/api/*` routes with `fetch()`
- **Linked widgets**: If your widget should follow the global `activeSymbol`, receive it as a prop and re-fetch on change
- **Formatting**: Import shared formatters from `lib/format.ts` (not local duplicates)
- **Error handling**: Display errors in a consistent "Unable to load [thing]: [reason]" format
- **Loading state**: Use simple `loading: boolean` and conditional rendering

See existing widgets (Quote, Chart, News) for examples.

---

## Deployment

### Docker

```bash
docker build -t openterminal-lite .
docker run -p 4100:4100 \
  -v /var/lib/openterminal:/data \
  -e PORT=4100 \
  -e PORTFOLIO_DB_PATH=/data/portfolio.db \
  openterminal-lite
```

### Systemd Service (Linux)

Create `/etc/systemd/system/openterminal.service`:
```ini
[Unit]
Description=OpenTerminal Lite
After=network.target

[Service]
Type=simple
User=openterminal
WorkingDirectory=/opt/openterminal
ExecStart=/opt/openterminal/terminal
Environment="PORT=4100"
Environment="NODE_ENV=production"
Environment="PORTFOLIO_DB_PATH=/var/lib/openterminal/portfolio.db"
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Then:
```bash
systemctl enable openterminal
systemctl start openterminal
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name terminal.example.com;
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:4100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Data Flow: A Real Example

### Viewing a Stock Quote

1. **User** clicks "Add Chart" widget → Svelte store adds widget
2. **WorkspaceGrid** mounts Chart.svelte, passes `symbol="AAPL"`
3. **Chart** calls `fetch(/api/market/candles?symbol=AAPL&timeframe=1Y)`
4. **Server** (routes/market.ts) receives request
5. **Server** checks cache: key = `market:candles:AAPL:1Y`
   - Hit: returns cached data (TTL: 30s for candles)
   - Miss: calls provider (US provider tries Nasdaq → Yahoo → Stooq)
6. **Provider** fetches from Nasdaq, returns candles
7. **Server** caches result + stale backup, returns JSON
8. **Chart** renders 1Y candles with SMA20/50, RSI overlays, volume

On provider outage (e.g., Nasdaq down):
- Nasdaq attempt fails, Yahoo attempt runs
- If all fail: return cached data if available
- If no cache: return 502 error

### Adding a Portfolio Transaction

1. **User** enters buy: 10 shares AAPL @ $150 on 2025-01-15
2. **Portfolio** widget POSTs `/api/portfolio/transactions`
   ```json
   { "market": "us", "symbol": "AAPL", "type": "buy", "quantity": 10, "price": 150, "date": "2025-01-15" }
   ```
3. **Server** validates input (market in set, date YYYY-MM-DD, etc.)
4. **Server** upserts holding (creates if new), updates quantity + weighted-avg cost
5. **Server** inserts transaction record (buy/sell log)
6. **Server** returns new transaction ID + updated net worth
7. **Portfolio** refreshes display

If external broker database is configured:
- Holdings from external DB are read-only (no writes)
- External holdings appear in net worth calculation
- Can add manual holdings alongside broker data

---

## Caching Strategy

**Two-tier cache** (live + stale):

```
Live cache (TTL-based expiry):
  ├─ short (30s):   quotes, candles, crypto OHLCV
  ├─ medium (5m):   search results, screener, news
  └─ long (1h):     FX rates, macro data, fundamentals

Stale cache (never expires):
  └─ Last successful fetch of any key
     → Fallback if live cache miss + provider fails
     → Prevents API outages from breaking the app
```

Example: FX rate USD→INR, TTL 1h
- 00:00 fetch: 83.5, cached as live + stale
- 00:45 user loads portfolio: stale hit (still live), returns 83.5
- 01:05 cache expired: re-fetch, hit API
- 01:06 API down: return stale (83.5) from backup
- User sees slightly stale data instead of error

See `server/src/cache.ts` and `server/src/routes/_utils.ts` (TTL constants).

---

## Common Issues & Troubleshooting

### Port Already in Use
```bash
lsof -i :4100
kill -9 <PID>
# Or change PORT env var
```

### Database Locked
SQLite with WAL mode can deadlock if multiple processes write simultaneously.
- Ensure only one server instance runs
- Check `ls -la data/` for `-wal` and `-shm` files (normal during writes)

### External Portfolio Database Not Found
```bash
export PORTFOLIO_DB_PATH=/path/to/portfolio.db
# Server will log warnings but continue (external holdings skipped)
```

### AI Assistant Not Available
- Set `ANTHROPIC_API_KEY` environment variable
- Get key at https://console.anthropic.com/
- Without it, AI widget shows "not configured" banner (doesn't break UI)

### Widgets Not Persisting Across Reload
- Layout stored in browser localStorage
- Widgets list saved automatically on drag/resize
- Clear localStorage: DevTools → Application → Local Storage → openterminal-layout → Delete

---

## Performance Notes

- **Charting**: Lightweight Charts renders 1000+ candles efficiently; >5000 candles may stutter
- **Screener**: Fetches all 1500 stocks once (cached), filters client-side for responsiveness
- **Provider latency**: Fallback chains add 100–500ms on first request (cached after)
- **Memory**: Single-process server uses ~80 MB at rest; SQLite connection pool minimal

---

## Security Notes

- **No authentication**: This is a personal dashboard. Deploy behind auth (Cloudflare Access, nginx auth_request, etc.)
- **CORS**: Allows all origins (`Access-Control-Allow-Origin: *`) for dev; restrict in production
- **SQL Injection**: All database access via prepared statements (Bun SQLite)
- **API secrets**: Store API keys in environment variables, never in git

---

## Contributing

### Code Style
- TypeScript strict mode enabled
- Svelte components use reactive stores for state
- No external styling framework (inline CSS + global theme)
- Format numeric output using `lib/format.ts` (shared formatters)

### Testing
- No automated tests currently (manual testing only)
- For major changes, test in production-like environment (same data, same broker integrations)

### Debugging
- **Frontend**: Browser DevTools (Chrome/Firefox; Svelte DevTools extension recommended)
- **Backend**: Check server logs (printed to stdout)
- **Database**: Use `sqlite3 data/openterminal-lite.db` for direct queries

---

## License

See LICENSE file in repository root.

---

## Support

For issues:
1. Check `lite/AUDIT.md` for known limitations and refactor status
2. Review `lite/GRIDSTACK_GOTCHAS.md` for widget grid quirks
3. Check recent server logs for errors
4. Trace data flow in Architecture section above

---

**Last updated**: 2026-09-09  
**Version**: 0.0.1 (prototype/MVP)
