import { useMemo, useState } from 'react'
import { getMarket } from '../data/engine'
import { getNews } from '../data/news'
import { useTerminal } from '../state/TerminalContext'
import { Panel, PanelButton } from '../components/Panel'
import CandleChart, { DEFAULT_CHART_OPTIONS } from '../components/CandleChart'
import { fmtPrice, fmtPct, fmtMoney, chgClass, fmtNum, fmtCompact } from '../lib/format'

const RANGES = [
  { label: '1M', days: 22 },
  { label: '3M', days: 66 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '5Y', days: 1300 },
]

/** MOST — market overview: index, movers, sector heat, headlines. */
export default function MOST() {
  const { execute } = useTerminal()
  const market = getMarket()
  const [rangeIdx, setRangeIdx] = useState(3)

  const sorted = useMemo(
    () => [...market.list].sort((a, b) => b.quote.changePct - a.quote.changePct),
    [market],
  )
  const gainers = sorted.slice(0, 6)
  const losers = sorted.slice(-6).reverse()

  const sectorPerf = useMemo(() => {
    const map = new Map<string, { sum: number; n: number; cap: number }>()
    for (const s of market.list) {
      const e = map.get(s.seed.sector) ?? { sum: 0, n: 0, cap: 0 }
      e.sum += s.quote.changePct
      e.n += 1
      e.cap += s.quote.marketCap
      map.set(s.seed.sector, e)
    }
    return [...map.entries()]
      .map(([sector, e]) => ({ sector, avg: e.sum / e.n, cap: e.cap }))
      .sort((a, b) => b.avg - a.avg)
  }, [market])

  const mostActive = useMemo(
    () => [...market.list].sort((a, b) => b.quote.volume * b.quote.last - a.quote.volume * a.quote.last).slice(0, 6),
    [market],
  )
  const headlines = getNews().slice(0, 7)

  const moverRow = (s: (typeof gainers)[number]) => (
    <button
      key={s.seed.ticker}
      onClick={() => execute(s.seed.ticker)}
      className="w-full grid grid-cols-[3.5rem_1fr_4.5rem_4.5rem] gap-1 px-2 py-[3px] text-xs text-left hover:bg-white/5 odd:bg-white/[0.02]"
    >
      <span className="text-cyan-300 font-bold">{s.seed.ticker}</span>
      <span className="text-zinc-500 truncate">{s.seed.name}</span>
      <span className="text-zinc-200 tabular-nums text-right">{fmtPrice(s.quote.last)}</span>
      <span className={`tabular-nums text-right ${chgClass(s.quote.changePct)}`}>{fmtPct(s.quote.changePct, 2, true)}</span>
    </button>
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 h-full min-h-0 auto-rows-min xl:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
      <Panel
        title={`${market.index.name} (${market.index.code}) — ${fmtNum(market.index.last)} ${fmtPct(market.index.changePct, 2, true)}`}
        className="xl:col-span-2 min-h-[300px]"
        right={
          <div className="flex gap-1">
            {RANGES.map((r, i) => (
              <PanelButton key={r.label} active={i === rangeIdx} onClick={() => setRangeIdx(i)}>
                {r.label}
              </PanelButton>
            ))}
          </div>
        }
      >
        <CandleChart
          candles={market.index.candles}
          range={RANGES[rangeIdx].days}
          options={{ ...DEFAULT_CHART_OPTIONS, subpane: 'none', sma200: false }}
        />
      </Panel>

      <Panel title="Sector Performance — Today" className="min-h-[300px]">
        <div className="p-2 space-y-1">
          {sectorPerf.map((s) => {
            const width = Math.min(Math.abs(s.avg) * 2500, 100)
            return (
              <div key={s.sector} className="text-xs">
                <div className="flex justify-between mb-0.5">
                  <span className="text-zinc-300">{s.sector}</span>
                  <span className={`tabular-nums ${chgClass(s.avg)}`}>{fmtPct(s.avg, 2, true)}</span>
                </div>
                <div className="h-1.5 bg-white/5">
                  <div
                    className={s.avg >= 0 ? 'h-full bg-up/70' : 'h-full bg-down/70'}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
          <p className="text-[10px] text-zinc-600 pt-1">Equal-weighted average of constituent moves.</p>
        </div>
      </Panel>

      <Panel title="Leaders / Laggards">
        <div className="grid grid-cols-1 divide-y divide-line">
          <div>
            <div className="px-2 py-0.5 text-[10px] text-up tracking-widest">TOP GAINERS</div>
            {gainers.map(moverRow)}
          </div>
          <div>
            <div className="px-2 py-0.5 text-[10px] text-down tracking-widest">TOP DECLINERS</div>
            {losers.map(moverRow)}
          </div>
        </div>
      </Panel>

      <Panel title="Most Active — $ Volume">
        {mostActive.map((s) => (
          <button
            key={s.seed.ticker}
            onClick={() => execute(s.seed.ticker)}
            className="w-full grid grid-cols-[3.5rem_1fr_5rem_4.5rem] gap-1 px-2 py-[5px] text-xs text-left hover:bg-white/5 odd:bg-white/[0.02]"
          >
            <span className="text-cyan-300 font-bold">{s.seed.ticker}</span>
            <span className="text-zinc-500 tabular-nums">{fmtCompact(s.quote.volume)} shs</span>
            <span className="text-zinc-200 tabular-nums text-right">{fmtMoney(s.quote.volume * s.quote.last)}</span>
            <span className={`tabular-nums text-right ${chgClass(s.quote.changePct)}`}>{fmtPct(s.quote.changePct, 2, true)}</span>
          </button>
        ))}
      </Panel>

      <Panel title="Top Headlines" right={<PanelButton onClick={() => execute('N')}>ALL NEWS →</PanelButton>}>
        {headlines.map((n) => (
          <button
            key={n.id}
            onClick={() => (n.tickers[0] ? execute(`${n.tickers[0]} N`) : execute('N'))}
            className="w-full px-2 py-1 text-left text-xs hover:bg-white/5 odd:bg-white/[0.02] flex gap-2"
          >
            <span className="text-zinc-600 shrink-0 tabular-nums">
              {new Date(n.ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            {n.tickers[0] && <span className="text-cyan-300 font-bold shrink-0">{n.tickers[0]}</span>}
            <span className="text-zinc-300 truncate">{n.headline}</span>
          </button>
        ))}
      </Panel>
    </div>
  )
}
