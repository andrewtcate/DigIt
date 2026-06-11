import { useMemo } from 'react'
import type { Security } from '../data/types'
import { getMarket } from '../data/engine'
import { getNews } from '../data/news'
import { useTerminal } from '../state/TerminalContext'
import { Panel, Stat } from '../components/Panel'
import CandleChart, { DEFAULT_CHART_OPTIONS } from '../components/CandleChart'
import { dailyReturns, regressBeta, annualizedVol, annualizedReturn, maxDrawdown, sharpe } from '../lib/finance'
import { RISK_FREE_RATE } from '../data/engine'
import { fmtPct, fmtNum, fmtMoney, fmtMillions, chgClass, fmtPrice, fmtCompact, fmtTime, fmtDate } from '../lib/format'

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 66 ? 'bg-up' : value >= 33 ? 'bg-warn' : 'bg-down'
  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs">
      <span className="w-20 text-zinc-500">{label}</span>
      <div className="flex-1 h-2 bg-white/5">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right tabular-nums text-zinc-200">{value.toFixed(0)}</span>
    </div>
  )
}

/** DES — company description, key stats, factor scores and 1Y chart. */
export default function DES({ security }: { security: Security }) {
  const { execute } = useTerminal()
  const market = getMarket()
  const s = security.seed
  const v = security.valuation
  const fin = security.financials
  const lastIs = fin.income.at(-1)!
  const lastRatios = fin.ratios.at(-1)!

  const riskStats = useMemo(() => {
    const closes = security.candles.map((c) => c.c)
    const idxCloses = market.index.candles.map((c) => c.c)
    const r = dailyReturns(closes)
    const ri = dailyReturns(idxCloses)
    const reg = regressBeta(r.slice(-252), ri.slice(-252))
    return {
      beta: reg.beta,
      alpha: reg.alphaAnnual,
      r2: reg.r2,
      vol: annualizedVol(r.slice(-252)),
      cagr: annualizedReturn(closes),
      sharpe: sharpe(r.slice(-252), RISK_FREE_RATE),
      maxDd: maxDrawdown(closes).drawdown,
    }
  }, [security, market])

  const news = useMemo(() => getNews().filter((n) => n.tickers.includes(s.ticker)).slice(0, 4), [s.ticker])
  const ratingClass = security.analyst.rating === 'BUY' ? 'text-up' : security.analyst.rating === 'SELL' ? 'text-down' : 'text-warn'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 auto-rows-min">
      <Panel title={`${s.name} — Profile`} className="xl:col-span-2">
        <div className="p-3 text-xs text-zinc-300 leading-relaxed">
          <p>{s.description}</p>
          <div className="grid grid-cols-2 gap-x-6 mt-3 text-[11px]">
            <Stat label="Sector" value={s.sector} />
            <Stat label="Industry" value={s.industry} />
            <Stat label="Headquarters" value={s.hq} />
            <Stat label="Founded" value={s.founded} />
            <Stat label="Employees" value={s.employees.toLocaleString()} />
            <Stat label="CEO" value={s.ceo} />
            <Stat label="Website" value={s.website} />
            <Stat label="Shares Out" value={`${fmtCompact(s.sharesOut * 1e6)}`} />
          </div>
        </div>
      </Panel>

      <Panel title="Valuation Snapshot">
        <div className="text-[11px] py-1">
          <Stat label="Market Cap" value={fmtMoney(security.quote.marketCap)} />
          <Stat label="Enterprise Value" value={fmtMoney(v.enterpriseValue)} />
          <Stat label="P/E (TTM)" value={fmtNum(v.pe, 1)} />
          <Stat label="P/E (Fwd)" value={fmtNum(v.forwardPe, 1)} />
          <Stat label="PEG" value={fmtNum(v.peg, 2)} />
          <Stat label="EV/EBITDA" value={fmtNum(v.evToEbitda, 1)} />
          <Stat label="EV/Sales" value={fmtNum(v.evToSales, 1)} />
          <Stat label="P/B" value={fmtNum(v.pb, 1)} />
          <Stat label="FCF Yield" value={fmtPct(v.fcfYield)} />
          <Stat label="Dividend Yield" value={fmtPct(v.dividendYield)} />
          <Stat label="Net Debt" value={fmtMoney(v.netDebt)} valueClass={v.netDebt > 0 ? 'text-zinc-100' : 'text-up'} />
        </div>
      </Panel>

      <Panel title="Risk & Return (1Y)">
        <div className="text-[11px] py-1">
          <Stat label="Beta vs ATX" value={fmtNum(riskStats.beta, 2)} />
          <Stat label="Alpha (ann.)" value={fmtPct(riskStats.alpha, 1, true)} valueClass={chgClass(riskStats.alpha)} />
          <Stat label="R²" value={fmtNum(riskStats.r2, 2)} />
          <Stat label="Volatility (ann.)" value={fmtPct(riskStats.vol, 1)} />
          <Stat label="Sharpe (1Y)" value={fmtNum(riskStats.sharpe, 2)} />
          <Stat label="CAGR (5Y)" value={fmtPct(riskStats.cagr, 1, true)} valueClass={chgClass(riskStats.cagr)} />
          <Stat label="Max Drawdown (5Y)" value={fmtPct(riskStats.maxDd, 1)} valueClass="text-down" />
          <Stat
            label="Analyst Consensus"
            value={`${security.analyst.rating} · PT ${fmtPrice(security.analyst.targetPrice)}`}
            valueClass={ratingClass}
          />
          <Stat label="Coverage" value={`${security.analyst.numAnalysts} analysts`} />
        </div>
      </Panel>

      <Panel title="Price — Trailing 12 Months" className="xl:col-span-3 h-72">
        <CandleChart
          candles={security.candles}
          range={252}
          options={{ ...DEFAULT_CHART_OPTIONS, subpane: 'none' }}
        />
      </Panel>

      <Panel title="Factor Scores (Percentile vs Universe)">
        <div className="py-1">
          <ScoreBar label="Value" value={security.scores.value} />
          <ScoreBar label="Growth" value={security.scores.growth} />
          <ScoreBar label="Quality" value={security.scores.quality} />
          <ScoreBar label="Momentum" value={security.scores.momentum} />
          <ScoreBar label="Composite" value={security.scores.composite} />
        </div>
        <div className="text-[11px] border-t border-line py-1">
          <Stat label={`Revenue (FY${lastIs.fiscalYear})`} value={fmtMillions(lastIs.revenue)} />
          <Stat label="Revenue Growth" value={fmtPct(lastRatios.revenueGrowth, 1, true)} valueClass={chgClass(lastRatios.revenueGrowth)} />
          <Stat label="Operating Margin" value={fmtPct(lastRatios.operatingMargin, 1)} />
          <Stat label="ROIC" value={fmtPct(lastRatios.roic, 1)} />
        </div>
      </Panel>

      <Panel title="Recent News" className="xl:col-span-4">
        {news.map((n) => (
          <button
            key={n.id}
            onClick={() => execute(`${s.ticker} N`)}
            className="w-full px-2 py-1 text-left text-xs hover:bg-white/5 odd:bg-white/[0.02] flex gap-3"
          >
            <span className="text-zinc-600 shrink-0 tabular-nums w-28">{fmtDate(n.ts)} {fmtTime(n.ts)}</span>
            <span className="text-zinc-300 truncate">{n.headline}</span>
            <span className="text-zinc-600 shrink-0 ml-auto">{n.source}</span>
          </button>
        ))}
      </Panel>
    </div>
  )
}
