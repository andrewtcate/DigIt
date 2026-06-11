import { useMemo } from 'react'
import type { Security } from '../data/types'
import { getMarket } from '../data/engine'
import { useTerminal } from '../state/TerminalContext'
import { Panel } from '../components/Panel'
import { fmtNum, fmtPct, fmtMoney, fmtPrice, chgClass } from '../lib/format'

function median(xs: number[]): number {
  const v = xs.filter(isFinite).sort((a, b) => a - b)
  if (!v.length) return NaN
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/** COMP — relative valuation against sector peers with implied-price bridge. */
export default function COMP({ security }: { security: Security }) {
  const { execute } = useTerminal()
  const market = getMarket()

  const peers = useMemo(() => {
    const sameSector = market.list.filter((x) => x.seed.sector === security.seed.sector)
    // Thin sectors borrow the largest names so the comp set stays meaningful.
    if (sameSector.length >= 4) return sameSector
    const fill = [...market.list]
      .filter((x) => !sameSector.includes(x))
      .sort((a, b) => b.quote.marketCap - a.quote.marketCap)
      .slice(0, 4 - sameSector.length)
    return [...sameSector, ...fill]
  }, [market, security])

  const rows = useMemo(
    () =>
      peers
        .map((p) => ({
          sec: p,
          isSelf: p.seed.ticker === security.seed.ticker,
          mcap: p.quote.marketCap,
          pe: p.valuation.pe,
          fpe: p.valuation.forwardPe,
          evEbitda: p.valuation.evToEbitda,
          evSales: p.valuation.evToSales,
          pb: p.valuation.pb,
          fcfYield: p.valuation.fcfYield,
          revGrowth: p.financials.ratios.at(-1)!.revenueGrowth,
          opMargin: p.financials.ratios.at(-1)!.operatingMargin,
          roic: p.financials.ratios.at(-1)!.roic,
        }))
        .sort((a, b) => b.mcap - a.mcap),
    [peers, security],
  )

  const med = useMemo(
    () => ({
      pe: median(rows.map((r) => r.pe)),
      fpe: median(rows.map((r) => r.fpe)),
      evEbitda: median(rows.map((r) => r.evEbitda)),
      evSales: median(rows.map((r) => r.evSales)),
      pb: median(rows.map((r) => r.pb)),
      fcfYield: median(rows.map((r) => r.fcfYield)),
      revGrowth: median(rows.map((r) => r.revGrowth)),
      opMargin: median(rows.map((r) => r.opMargin)),
      roic: median(rows.map((r) => r.roic)),
    }),
    [rows],
  )

  // Implied prices from applying peer-median multiples to this company.
  const implied = useMemo(() => {
    const is = security.financials.income.at(-1)!
    const shares = security.seed.sharesOut
    const netDebtM = security.valuation.netDebt / 1e6
    const fromEv = (ev: number) => (ev - netDebtM) / shares
    return [
      { label: 'Peer-Median P/E × EPS', price: med.pe * is.eps },
      { label: 'Peer-Median EV/EBITDA', price: fromEv(med.evEbitda * is.ebitda) },
      { label: 'Peer-Median EV/Sales', price: fromEv(med.evSales * is.revenue) },
    ].filter((x) => isFinite(x.price) && x.price > 0)
  }, [security, med])

  const px = security.quote.last
  const minP = Math.min(...implied.map((i) => i.price), px) * 0.9
  const maxP = Math.max(...implied.map((i) => i.price), px) * 1.1

  const cell = (v: number, fmt: (x: number) => string, better: 'low' | 'high', m: number) => {
    if (!isFinite(v)) return <span className="text-zinc-600">—</span>
    const good = better === 'low' ? v < m : v > m
    return <span className={good ? 'text-up' : 'text-down/90'}>{fmt(v)}</span>
  }

  return (
    <div className="flex flex-col gap-2">
      <Panel title={`Comparable Companies — ${security.seed.sector}`}>
        <table className="w-full text-[11px] tabular-nums">
          <thead className="sticky top-0 bg-panelhead">
            <tr className="text-zinc-500 border-b border-line">
              {['TICKER', 'MKT CAP', 'P/E', 'FWD P/E', 'EV/EBITDA', 'EV/SALES', 'P/B', 'FCF YLD', 'REV GR', 'OP MGN', 'ROIC'].map((h, i) => (
                <th key={h} className={`px-2 py-1.5 font-normal ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.sec.seed.ticker}
                onClick={() => !r.isSelf && execute(`${r.sec.seed.ticker} COMP`)}
                className={`border-b border-line/40 ${
                  r.isSelf ? 'bg-amber/10 border-l-2 border-l-amber' : 'hover:bg-white/[0.04] cursor-pointer'
                }`}
              >
                <td className={`px-2 py-1 font-bold ${r.isSelf ? 'text-amber' : 'text-cyan-300'}`}>{r.sec.seed.ticker}</td>
                <td className="px-2 py-1 text-right text-zinc-300">{fmtMoney(r.mcap, 0)}</td>
                <td className="px-2 py-1 text-right">{cell(r.pe, (x) => fmtNum(x, 1), 'low', med.pe)}</td>
                <td className="px-2 py-1 text-right">{cell(r.fpe, (x) => fmtNum(x, 1), 'low', med.fpe)}</td>
                <td className="px-2 py-1 text-right">{cell(r.evEbitda, (x) => fmtNum(x, 1), 'low', med.evEbitda)}</td>
                <td className="px-2 py-1 text-right">{cell(r.evSales, (x) => fmtNum(x, 1), 'low', med.evSales)}</td>
                <td className="px-2 py-1 text-right">{cell(r.pb, (x) => fmtNum(x, 1), 'low', med.pb)}</td>
                <td className="px-2 py-1 text-right">{cell(r.fcfYield, (x) => fmtPct(x, 1), 'high', med.fcfYield)}</td>
                <td className="px-2 py-1 text-right">{cell(r.revGrowth, (x) => fmtPct(x, 1), 'high', med.revGrowth)}</td>
                <td className="px-2 py-1 text-right">{cell(r.opMargin, (x) => fmtPct(x, 1), 'high', med.opMargin)}</td>
                <td className="px-2 py-1 text-right">{cell(r.roic, (x) => fmtPct(x, 1), 'high', med.roic)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-amber/40 text-zinc-100 font-semibold bg-white/[0.03]">
              <td className="px-2 py-1">PEER MEDIAN</td>
              <td className="px-2 py-1" />
              <td className="px-2 py-1 text-right">{fmtNum(med.pe, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtNum(med.fpe, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtNum(med.evEbitda, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtNum(med.evSales, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtNum(med.pb, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtPct(med.fcfYield, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtPct(med.revGrowth, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtPct(med.opMargin, 1)}</td>
              <td className="px-2 py-1 text-right">{fmtPct(med.roic, 1)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-600 px-2 py-1.5">
          Green = better than peer median (cheaper on valuation rows, stronger on fundamentals). Click a peer to re-anchor the comp set.
        </p>
      </Panel>

      <Panel title="Implied Value — Peer-Median Multiples (Football Field)">
        <div className="p-3 space-y-2">
          {implied.map((i) => {
            const left = ((i.price - minP) / (maxP - minP)) * 100
            const rel = i.price / px - 1
            return (
              <div key={i.label} className="flex items-center gap-2 text-[11px]">
                <span className="w-48 text-zinc-400 shrink-0">{i.label}</span>
                <div className="relative flex-1 h-5 bg-white/[0.04]">
                  <div
                    className="absolute top-0 bottom-0 w-[3px] bg-zinc-300"
                    style={{ left: `${((px - minP) / (maxP - minP)) * 100}%` }}
                    title={`Current price ${fmtPrice(px)}`}
                  />
                  <div
                    className={`absolute top-1 bottom-1 w-2 ${rel >= 0 ? 'bg-up' : 'bg-down'}`}
                    style={{ left: `calc(${left}% - 4px)` }}
                  />
                </div>
                <span className={`w-20 text-right tabular-nums ${chgClass(rel)}`}>{fmtPrice(i.price)}</span>
                <span className={`w-16 text-right tabular-nums ${chgClass(rel)}`}>{fmtPct(rel, 1, true)}</span>
              </div>
            )
          })}
          <p className="text-[10px] text-zinc-600 pt-1">
            White bar marks the current price {fmtPrice(px)}. Markers show what the stock would trade at if it carried the peer-median multiple.
          </p>
        </div>
      </Panel>
    </div>
  )
}
