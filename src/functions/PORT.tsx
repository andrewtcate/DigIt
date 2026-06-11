import { useMemo, useState } from 'react'
import { getMarket, RISK_FREE_RATE } from '../data/engine'
import { useTerminal, type Holding } from '../state/TerminalContext'
import { Panel, PanelButton, Stat } from '../components/Panel'
import {
  dailyReturns, regressBeta, annualizedVol, sharpe, sortino,
  historicalVaR, cvar, maxDrawdown, correlation,
} from '../lib/finance'
import { fmtMoney, fmtNum, fmtPct, fmtPrice, chgClass, downloadCsv } from '../lib/format'

/** PORT — holdings, P&L, risk statistics and a correlation matrix. */
export default function PORT() {
  const market = getMarket()
  const { holdings, setHoldings, execute } = useTerminal()
  const [newTicker, setNewTicker] = useState('')
  const [error, setError] = useState<string | null>(null)

  const analysis = useMemo(() => {
    const valid = holdings.filter((h) => market.securities.has(h.ticker) && h.shares > 0)
    const rows = valid.map((h) => {
      const sec = market.securities.get(h.ticker)!
      const value = sec.quote.last * h.shares
      const cost = h.costBasis * h.shares
      return {
        h, sec, value, cost,
        pnl: value - cost,
        pnlPct: value / cost - 1,
        dayPnl: sec.quote.change * h.shares,
      }
    })
    const totalValue = rows.reduce((a, r) => a + r.value, 0)
    const totalCost = rows.reduce((a, r) => a + r.cost, 0)
    const dayPnl = rows.reduce((a, r) => a + r.dayPnl, 0)

    // Portfolio daily return series (current weights, trailing year).
    const lookback = 252
    let portReturns: number[] = []
    const retSeries: { ticker: string; rets: number[] }[] = []
    if (rows.length) {
      const weights = rows.map((r) => r.value / totalValue)
      const allRets = rows.map((r) => dailyReturns(r.sec.candles.map((c) => c.c)).slice(-lookback))
      retSeries.push(...rows.map((r, i) => ({ ticker: r.h.ticker, rets: allRets[i] })))
      const n = Math.min(...allRets.map((x) => x.length))
      portReturns = Array.from({ length: n }, (_, d) =>
        allRets.reduce((acc, rets, i) => acc + weights[i] * rets[rets.length - n + d], 0),
      )
    }
    const idxRets = dailyReturns(market.index.candles.map((c) => c.c)).slice(-lookback)
    const reg = portReturns.length ? regressBeta(portReturns, idxRets) : null

    // Synthetic value curve for drawdown.
    let v = 1
    const curve = [1, ...portReturns.map((r) => (v *= 1 + r))]

    // Sector allocation.
    const sectorMap = new Map<string, number>()
    for (const r of rows) {
      sectorMap.set(r.sec.seed.sector, (sectorMap.get(r.sec.seed.sector) ?? 0) + r.value)
    }
    const sectors = [...sectorMap.entries()]
      .map(([s, val]) => ({ sector: s, weight: val / totalValue }))
      .sort((a, b) => b.weight - a.weight)

    return {
      rows, totalValue, totalCost, dayPnl,
      totalPnl: totalValue - totalCost,
      totalPnlPct: totalCost ? totalValue / totalCost - 1 : NaN,
      beta: reg?.beta ?? NaN,
      alpha: reg?.alphaAnnual ?? NaN,
      vol: portReturns.length ? annualizedVol(portReturns) : NaN,
      sharpe: portReturns.length ? sharpe(portReturns, RISK_FREE_RATE) : NaN,
      sortino: portReturns.length ? sortino(portReturns, RISK_FREE_RATE) : NaN,
      var95: portReturns.length ? historicalVaR(portReturns) : NaN,
      cvar95: portReturns.length ? cvar(portReturns) : NaN,
      maxDd: curve.length > 2 ? maxDrawdown(curve).drawdown : NaN,
      retSeries, sectors,
    }
  }, [holdings, market])

  const updateHolding = (ticker: string, patch: Partial<Holding>) =>
    setHoldings(holdings.map((h) => (h.ticker === ticker ? { ...h, ...patch } : h)))

  const addHolding = () => {
    const t = newTicker.trim().toUpperCase()
    if (!t) return
    const sec = market.securities.get(t)
    if (!sec) {
      setError(`Unknown ticker "${t}"`)
      return
    }
    if (holdings.some((h) => h.ticker === t)) {
      setError(`${t} is already in the portfolio`)
      return
    }
    setHoldings([...holdings, { ticker: t, shares: 100, costBasis: Math.round(sec.quote.last * 100) / 100 }])
    setNewTicker('')
    setError(null)
  }

  const exportCsv = () =>
    downloadCsv('portfolio.csv', [
      ['Ticker', 'Shares', 'CostBasis', 'Price', 'Value', 'Weight%', 'PnL', 'PnL%'],
      ...analysis.rows.map((r) => [
        r.h.ticker, r.h.shares, r.h.costBasis.toFixed(2), r.sec.quote.last.toFixed(2),
        r.value.toFixed(0), ((r.value / analysis.totalValue) * 100).toFixed(1),
        r.pnl.toFixed(0), (r.pnlPct * 100).toFixed(1),
      ]),
    ])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 auto-rows-min">
      <Panel
        title={`Holdings — ${fmtMoney(analysis.totalValue)} · Day ${fmtMoney(analysis.dayPnl)} (${fmtPct(analysis.dayPnl / (analysis.totalValue - analysis.dayPnl), 2, true)})`}
        className="xl:col-span-2"
        right={<PanelButton onClick={exportCsv}>⬇ CSV</PanelButton>}
      >
        <table className="w-full text-[11px] tabular-nums">
          <thead className="bg-panelhead">
            <tr className="text-zinc-500 border-b border-line">
              {['TICKER', 'SHARES', 'COST/SH', 'PRICE', 'VALUE', 'WEIGHT', 'DAY P&L', 'TOTAL P&L', ''].map((h, i) => (
                <th key={h || 'x'} className={`px-2 py-1.5 font-normal ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.rows.map((r) => (
              <tr key={r.h.ticker} className="border-b border-line/40 hover:bg-white/[0.03]">
                <td className="px-2 py-1">
                  <button className="text-cyan-300 font-bold hover:text-amber" onClick={() => execute(r.h.ticker)}>
                    {r.h.ticker}
                  </button>
                </td>
                <td className="px-2 py-1 text-right">
                  <input
                    type="number"
                    value={r.h.shares}
                    min={0}
                    onChange={(e) => updateHolding(r.h.ticker, { shares: Math.max(Number(e.target.value), 0) })}
                    className="w-20 bg-black border border-line text-right text-zinc-200 px-1 outline-none focus:border-amber"
                  />
                </td>
                <td className="px-2 py-1 text-right">
                  <input
                    type="number"
                    value={r.h.costBasis}
                    min={0}
                    step={0.01}
                    onChange={(e) => updateHolding(r.h.ticker, { costBasis: Math.max(Number(e.target.value), 0) })}
                    className="w-20 bg-black border border-line text-right text-zinc-200 px-1 outline-none focus:border-amber"
                  />
                </td>
                <td className="px-2 py-1 text-right text-zinc-200">{fmtPrice(r.sec.quote.last)}</td>
                <td className="px-2 py-1 text-right text-zinc-100 font-semibold">{fmtMoney(r.value)}</td>
                <td className="px-2 py-1 text-right text-zinc-400">{fmtPct(r.value / analysis.totalValue, 1)}</td>
                <td className={`px-2 py-1 text-right ${chgClass(r.dayPnl)}`}>{fmtMoney(r.dayPnl)}</td>
                <td className={`px-2 py-1 text-right ${chgClass(r.pnl)}`}>
                  {fmtMoney(r.pnl)} ({fmtPct(r.pnlPct, 1, true)})
                </td>
                <td className="px-1 py-1 text-right">
                  <button
                    className="text-zinc-600 hover:text-down"
                    title={`Remove ${r.h.ticker}`}
                    onClick={() => setHoldings(holdings.filter((h) => h.ticker !== r.h.ticker))}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-2 p-2 border-t border-line">
          <input
            value={newTicker}
            onChange={(e) => {
              setNewTicker(e.target.value.toUpperCase())
              setError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && addHolding()}
            placeholder="ADD TICKER"
            className="w-28 bg-black border border-line px-2 py-1 text-amber text-[11px] outline-none focus:border-amber uppercase"
          />
          <PanelButton onClick={addHolding}>+ ADD</PanelButton>
          {error && <span className="text-down text-[10px]">{error}</span>}
        </div>
      </Panel>

      <div className="flex flex-col gap-2">
        <Panel title="Risk Analytics (1Y, current weights)">
          <div className="text-[11px] py-1">
            <Stat label="Total P&L" value={`${fmtMoney(analysis.totalPnl)} (${fmtPct(analysis.totalPnlPct, 1, true)})`} valueClass={chgClass(analysis.totalPnl)} />
            <Stat label="Beta vs ATX" value={fmtNum(analysis.beta, 2)} />
            <Stat label="Alpha (ann.)" value={fmtPct(analysis.alpha, 1, true)} valueClass={chgClass(analysis.alpha)} />
            <Stat label="Volatility (ann.)" value={fmtPct(analysis.vol, 1)} />
            <Stat label="Sharpe Ratio" value={fmtNum(analysis.sharpe, 2)} valueClass={analysis.sharpe > 1 ? 'text-up' : 'text-zinc-100'} />
            <Stat label="Sortino Ratio" value={fmtNum(analysis.sortino, 2)} />
            <Stat label="VaR 95% (1-day)" value={`${fmtPct(analysis.var95, 2)} · ${fmtMoney(analysis.var95 * analysis.totalValue)}`} valueClass="text-down" />
            <Stat label="CVaR 95% (1-day)" value={`${fmtPct(analysis.cvar95, 2)} · ${fmtMoney(analysis.cvar95 * analysis.totalValue)}`} valueClass="text-down" />
            <Stat label="Max Drawdown (1Y)" value={fmtPct(analysis.maxDd, 1)} valueClass="text-down" />
          </div>
        </Panel>
        <Panel title="Sector Allocation">
          <div className="p-2 space-y-1">
            {analysis.sectors.map((s) => (
              <div key={s.sector} className="text-[11px]">
                <div className="flex justify-between mb-0.5">
                  <span className="text-zinc-400">{s.sector}</span>
                  <span className="text-zinc-200 tabular-nums">{fmtPct(s.weight, 1)}</span>
                </div>
                <div className="h-1.5 bg-white/5">
                  <div className="h-full bg-amber/70" style={{ width: `${s.weight * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Correlation Matrix — Daily Returns (1Y)" className="xl:col-span-3">
        <div className="p-2 overflow-x-auto">
          <table className="text-[10px] tabular-nums">
            <thead>
              <tr>
                <th />
                {analysis.retSeries.map((r) => (
                  <th key={r.ticker} className="px-1 py-1 text-zinc-500 font-normal">{r.ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analysis.retSeries.map((a) => (
                <tr key={a.ticker}>
                  <td className="px-1 py-0.5 text-zinc-500 text-right">{a.ticker}</td>
                  {analysis.retSeries.map((b) => {
                    const c = a.ticker === b.ticker ? 1 : correlation(a.rets, b.rets)
                    // Diverging heat: red (high corr → less diversification) to green.
                    const alpha = Math.abs(c) * 0.55
                    const bg = c > 0 ? `rgba(239,68,68,${alpha})` : `rgba(34,197,94,${alpha})`
                    return (
                      <td
                        key={b.ticker}
                        className="px-1 py-0.5 text-center text-zinc-100 min-w-11"
                        style={{ backgroundColor: bg }}
                      >
                        {c.toFixed(2)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-zinc-600 mt-2">
            Deeper red = stronger positive correlation (less diversification benefit). VaR/CVaR are historical, computed from the trailing year of simulated daily returns at current weights.
          </p>
        </div>
      </Panel>
    </div>
  )
}
