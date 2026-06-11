# ATLAS Terminal

A command-driven equity analytics workstation in the browser — the Bloomberg Terminal
workflow, rebuilt to keep its advantages and fix its disadvantages.

![stack](https://img.shields.io/badge/stack-React%2019%20·%20TypeScript%20·%20Vite%20·%20Tailwind-informational)

## Philosophy

| Bloomberg advantage | Kept |
|---|---|
| Command-driven speed — every screen is a typed function code | ✅ `NVDA DCF`, `EQS`, `PORT`, F1–F8 hotkeys |
| Information density — one glance, whole picture | ✅ dense dark panels, tabular numerics, watchlist rail always on |
| Everything in one place — quotes, statements, models, news | ✅ 12 integrated screens sharing one data engine |
| Deep analytics, not just charts | ✅ DCF, WACC, comps, VaR/CVaR, Monte Carlo, Black–Scholes |

| Bloomberg disadvantage | Fixed |
|---|---|
| $25K+/yr seat license | Free, open source |
| Memorize-or-die command codes | Autocomplete with fuzzy matching on tickers, names and plain English; `Tab` completes |
| Proprietary hardware/keyboard | Any browser, standard keys |
| 1980s UI | Modern canvas charting, responsive layout |
| Closed ecosystem, hard to get data out | One-click CSV export on every table |
| Steep learning curve | `HELP` screen, discoverable function tabs on every security |

## Screens (type the code, or `HELP` for the directory)

| Code | Screen |
|---|---|
| `MOST` | Market movers, sector heat, index chart, headlines |
| `DES` | Company profile, valuation snapshot, factor scores, risk/return stats |
| `GP` | Candlestick workstation — SMA/EMA/Bollinger overlays, RSI/MACD subpanes, log scale, index comparison, crosshair |
| `FA` | 5-year income / balance / cash-flow statements + 17 ratios, trend bars, CSV export |
| `DCF` | Interactive unlevered DCF — CAPM/WACC build-up, fading-growth projection, WACC × terminal-growth sensitivity grid |
| `COMP` | Comparable-company multiples vs sector peers + implied-value football field |
| `EQS` | Multi-factor screener with presets (Deep Value, Quality, GARP…), sortable, exportable |
| `PORT` | Editable portfolio — P&L, beta/alpha, Sharpe/Sortino, historical VaR & CVaR, correlation matrix, sector allocation |
| `MC` | Monte Carlo GBM fan chart, terminal distribution, P(above target) |
| `OVM` | Black–Scholes pricer with full greeks + modeled option chain with volatility smile |
| `N` | Newswire, filterable by security and category |
| `HELP` | Command grammar, keyboard map, function directory |

**Command grammar:** `TICKER` · `TICKER FUNC` · `FUNC` (uses active security) — e.g. `AAPL`, `NVDA DCF`, `screen`, `apple chart`.
**Keys:** `/` or `Ctrl+K` focus command line · `Tab` autocomplete · `F1–F8` jump screens · `Alt+←` back.

## ⚠ Data

All prices, financial statements, quotes and news are produced by a **deterministic
simulation engine** (`src/data/engine.ts`) — seeded GBM with a shared market factor,
stochastic volatility and jumps; statement generation calibrated per company. Numbers
are plausible in scale but are **not real market data — do not trade on them.**
The data layer is fully isolated behind `getMarket()` / `getSecurity()`, so a licensed
vendor adapter (IEX, Polygon, Refinitiv…) can be dropped in without touching a single screen.

## Architecture

```
src/
  lib/        random.ts (seeded PRNG) · finance.ts (DCF, WACC, VaR, B-S, Monte Carlo)
              indicators.ts (SMA/EMA/RSI/MACD/Bollinger/ATR) · format.ts
  data/       universe.ts (24-company seed set) · engine.ts (market simulation)
              news.ts · types.ts
  state/      registry.ts (function codes) · TerminalContext.tsx (navigation, watchlist, portfolio)
  components/ CandleChart.tsx (custom canvas engine) · CommandBar · Watchlist · QuoteHeader · …
  functions/  one file per terminal screen (MOST, DES, GP, FA, DCF, COMP, EQS, PORT, MC, OVM, NEWS, HELP)
```

No charting or math dependencies — the candle engine and the quant library are hand-rolled.
Runtime deps: React and ReactDOM only.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run lint
```
