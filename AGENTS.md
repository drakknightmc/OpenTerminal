# AGENTS.md — coordination rules for this rewrite

This file is the single source of truth for every agent (opencode-coder, codex-coder,
or otherwise) working on the `lite-rewrite` branch. Read it fully before touching
anything. If it conflicts with your task prompt, this file wins on process/ownership
questions; your prompt wins on what to actually build.

## What this is

OpenTerminal is being rewritten from Next.js+React+Express (`web/`, `server/` —
untouched, stays working on `main` as the reference implementation) into a
Beszel-weight equivalent: single Bun binary, Svelte+Vite frontend, target under
100MB total, ideally closer to 20-50MB, low idle RAM. New code lives under `lite/`.
Do not edit `web/` or `server/` unless a task explicitly says to port logic FROM
them (read-only reference) — never edit them in place.

## Why this file exists — the rule that matters most

An earlier round of parallel opencode-coder agents against this SAME shared
checkout silently lost two agents' edits (docker-compose.yml, .gitignore) even
though no other agent was assigned those files. Root cause wasn't scope overlap —
it looks like a snapshot/write-back race when multiple agent processes run
concurrently against one working directory. The fix: **never run two agents
concurrently against the same working directory again.**

### Mandatory protocol for every agent

1. Before doing ANY work, create your own isolated git worktree and branch off
   `lite-rewrite`:
   ```
   git worktree add ../ot-agent-<short-task-name> -b lite/<short-task-name> lite-rewrite
   cd ../ot-agent-<short-task-name>
   ```
   (Run this from the main repo checkout path you were given, not from inside
   another agent's worktree.)
2. Do all your work inside that worktree only. Commit your changes there
   (small, logical commits, clear messages — no need to ask permission to
   commit on your own branch).
3. Report back your branch name (`lite/<short-task-name>`) and worktree path.
   Do NOT merge into `lite-rewrite` yourself — the coordinator (Claude session
   orchestrating this) merges each branch in sequentially and verifies with a
   real `git diff` before moving to the next one. This is deliberate, not
   optional — it's the only way we caught the earlier silent data loss.
4. If your task depends on another agent's not-yet-merged work, say so in your
   report instead of guessing at unmerged file contents.

## Stack decisions (locked, don't relitigate without asking the coordinator)

- **Runtime**: Bun (not Node). Use `bun:sqlite` for the DB (built-in, no native
  module, no per-arch prebuilt-binary problem). Compile to a single binary with
  `bun build --compile` for deployment; `bun run` during dev.
- **Frontend**: Vite + Svelte (not Next.js, not React). No SSR — this is a
  client dashboard, SSR buys nothing here and Next.js's SSR machinery is a big
  chunk of the current bloat.
- **Charting**: keep `lightweight-charts` (framework-agnostic, small, already
  proven in the old app). Drop `recharts` and `d3` — replace the sector heatmap
  with a plain CSS grid (color by %, size by market-cap tier via grid-column
  span, not a true D3 treemap) and the yield curve with a simple SVG line, no
  charting-library dependency needed for either.
- **Grid/layout**: drop `react-grid-layout`. Use a lightweight Svelte-native
  grid (evaluate `svelte-grid` or similar small lib) or a simpler CSS-grid
  layout with fewer drag/resize affordances if no small library fits. Don't
  reach for anything with a large dependency footprint — that defeats the
  point of this rewrite.
- **One process, one port**: Bun serves both the built static frontend
  (`lite/web/dist`, embedded or read at startup) and the API. No separate
  frontend server process like the old `web`/`api` split.
- **Portfolio currency model** (confirmed with the user, don't change without
  asking): each holding is stored and displayed in its **native currency**
  (US stocks in USD, Indian stocks/mutual funds in INR, crypto in USD). Net
  worth total is computed in BOTH INR and USD (live FX conversion of every
  leg), with a UI toggle to switch which total is primary. Per-holding, show
  an optional secondary line with the converted value in the other currency
  (e.g. a USD stock also shows its INR-equivalent value, toggleable/dimmed).
- **FX rates**: Frankfurter (ECB-based, free, no key, `https://api.frankfurter.dev`)
  as primary, `exchangerate.host` as fallback — same fallback-chain pattern as
  every other provider in this app.
- **Markets in scope now**: US equities, Indian equities (NSE/BSE), crypto,
  Indian mutual funds. IPO RSS feeds and Reddit feeds are explicitly deferred
  ("later" per user) — leave a documented extension point (an empty
  `providers/ipo/` and `providers/reddit/` dir with a `README.md` stub saying
  "not built yet, see AGENTS.md") but do not build them now.
- **India equities data source**: NSE India's own public JSON endpoints as
  primary (same "reverse-engineered but widely used" category as the old
  app's TradingView/Nasdaq providers — needs a cookie-warmup request before
  the real API call, and a believable Referer), Yahoo Finance with `.NS`/`.BO`
  ticker suffixes as fallback.
- **Indian mutual funds**: `mfapi.in` (free, clean JSON wrapper over AMFI's
  official daily NAV data, no key required) for NAV/history/scheme search.

## Directory layout

```
lite/
  server/
    src/
      index.ts            # Bun.serve entrypoint, serves API + static dist
      db.ts                # bun:sqlite setup, WAL mode
      cache.ts             # port cache.ts's TTL/stale-while-revalidate as-is
      providers/
        us/                # nasdaq, yahoo, stooq, tradingview scanner, options
        india/             # nse.ts, yahooIndia.ts
        crypto/            # coingecko.ts, binance.ts
        mutualfunds/       # mfapi.ts
        macro/             # fred.ts
        news/              # rss.ts (yahoo + google news, per-symbol + global)
        fx/                # frankfurter.ts, exchangerateHost.ts
        ipo/               # README.md stub only, not built
        reddit/            # README.md stub only, not built
      routes/              # market, portfolio, ai, fx
      portfolio/           # net-worth engine, multi-currency aggregation
  web/
    src/
      widgets/             # one file/dir per widget, mirrors old web/components/widgets
      lib/                 # API client, indicators (port as-is from old web/lib)
      store/               # svelte stores replacing the old Zustand store
docs/
  DECISIONS.md             # mirrors the HTML decisions doc shared with the user
```

## File ownership / status board

Update this table when you claim a task (before starting work) and when you
finish (with your branch name). Coordinator merges in the order tasks are
marked DONE, oldest first, verifying each with `git diff` against
`lite-rewrite` before moving to the next.

| Task | Owner (branch) | Status | Notes |
|---|---|---|---|
| Scaffold: Bun server skeleton + Vite/Svelte skeleton + build pipeline | (coordinator, first task, no parallelism until this merges) | pending | Everything else depends on this landing first |
| Macro and news providers | lite/macro-news | done | FRED yields/VIX, Yahoo/Google RSS, deferred IPO/Reddit stubs |

Add rows below this one as tasks are claimed. Never edit another agent's row
except to note a merge conflict the coordinator needs to resolve.
