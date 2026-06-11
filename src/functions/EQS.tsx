import { useMemo, useState } from 'react'
import { getMarket } from '../data/engine'
import { SECTORS } from '../data/universe'
import { useTerminal } from '../state/TerminalContext'
import { Panel, PanelButton } from '../components/Panel'
import { fmtNum, fmtPct, fmtMoney, chgClass, downloadCsv } from '../lib/format'

interface Criteria {
  sector: string // '' = all
  maxPe: number | null
  maxEvEbitda: number | null
  minRevGrowth: number | null
  minOpMargin: number | null
  minRoic: number | null
  minFcfYield: number | null
  minComposite: number | null
}

const EMPTY: Criteria = {
  sector: '', maxPe: null, maxEvEbitda: null, minRevGrowth: null,
  minOpMargin: null, minRoic: null, minFcfYield: null, minComposite: null,
}

const PRESETS: { name: string; desc: string; criteria: Partial<Criteria> }[] = [
  { name: 'DEEP VALUE', desc: 'Cheap on earnings and cash flow', criteria: { maxPe: 20, minFcfYield: 0.04 } },
  { name: 'QUALITY', desc: 'High returns on capital, fat margins', criteria: { minRoic: 0.15, minOpMargin: 0.20 } },
  { name: 'GROWTH', desc: 'Fast compounders', criteria: { minRevGrowth: 0.12 } },
  { name: 'GARP', desc: 'Growth at a reasonable price', criteria: { minRevGrowth: 0.08, maxPe: 30 } },
  { name: 'TOP RANKED', desc: 'Composite factor score ≥ 60', criteria: { minComposite: 60 } },
]

type SortKey = 'ticker' | 'mcap' | 'pe' | 'evEbitda' | 'revGrowth' | 'opMargin' | 'roic' | 'fcfYield' | 'momentum' | 'composite'

function NumInput({ label, value, onChange, pct = false }: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  pct?: boolean
}) {
  return (
    <label className="flex items-center gap-1 text-[10px] text-zinc-500">
      {label}
      <input
        type="number"
        value={value === null ? '' : pct ? Math.round(value * 100) : value}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(null)
          const n = Number(raw)
          onChange(pct ? n / 100 : n)
        }}
        placeholder="—"
        className="w-14 bg-black border border-line px-1 py-0.5 text-amber text-[11px] outline-none focus:border-amber tabular-nums"
      />
      {pct && '%'}
    </label>
  )
}

/** EQS — multi-factor screener with presets, sorting and CSV export. */
export default function EQS() {
  const { execute } = useTerminal()
  const market = getMarket()
  const [c, setC] = useState<Criteria>(EMPTY)
  const [sortKey, setSortKey] = useState<SortKey>('composite')
  const [sortDesc, setSortDesc] = useState(true)

  const rows = useMemo(() => {
    const all = market.list.map((s) => {
      const ratios = s.financials.ratios.at(-1)!
      const closes = s.candles.map((x) => x.c)
      return {
        sec: s,
        ticker: s.seed.ticker,
        mcap: s.quote.marketCap,
        pe: s.valuation.pe,
        evEbitda: s.valuation.evToEbitda,
        revGrowth: ratios.revenueGrowth,
        opMargin: ratios.operatingMargin,
        roic: ratios.roic,
        fcfYield: s.valuation.fcfYield,
        momentum: closes[closes.length - 1] / closes[closes.length - 1 - 126] - 1,
        composite: s.scores.composite,
      }
    })
    const filtered = all.filter((r) => {
      if (c.sector && r.sec.seed.sector !== c.sector) return false
      if (c.maxPe !== null && !(r.pe > 0 && r.pe <= c.maxPe)) return false
      if (c.maxEvEbitda !== null && !(r.evEbitda > 0 && r.evEbitda <= c.maxEvEbitda)) return false
      if (c.minRevGrowth !== null && !(r.revGrowth >= c.minRevGrowth)) return false
      if (c.minOpMargin !== null && !(r.opMargin >= c.minOpMargin)) return false
      if (c.minRoic !== null && !(r.roic >= c.minRoic)) return false
      if (c.minFcfYield !== null && !(r.fcfYield >= c.minFcfYield)) return false
      if (c.minComposite !== null && !(r.composite >= c.minComposite)) return false
      return true
    })
    filtered.sort((a, b) => {
      if (sortKey === 'ticker') return sortDesc ? b.ticker.localeCompare(a.ticker) : a.ticker.localeCompare(b.ticker)
      const av = a[sortKey]
      const bv = b[sortKey]
      return sortDesc ? bv - av : av - bv
    })
    return filtered
  }, [market, c, sortKey, sortDesc])

  const header = (label: string, key: SortKey) => (
    <th
      className="px-2 py-1.5 font-normal text-right cursor-pointer hover:text-amber select-none whitespace-nowrap first:text-left"
      onClick={() => {
        if (sortKey === key) setSortDesc((d) => !d)
        else {
          setSortKey(key)
          setSortDesc(true)
        }
      }}
    >
      {label}
      {sortKey === key && <span className="text-amber"> {sortDesc ? '▼' : '▲'}</span>}
    </th>
  )

  const exportCsv = () =>
    downloadCsv('screen_results.csv', [
      ['Ticker', 'Name', 'Sector', 'MktCap($B)', 'P/E', 'EV/EBITDA', 'RevGrowth%', 'OpMargin%', 'ROIC%', 'FCFYield%', '6MMom%', 'Composite'],
      ...rows.map((r) => [
        r.ticker, r.sec.seed.name, r.sec.seed.sector, (r.mcap / 1e9).toFixed(1),
        r.pe.toFixed(1), r.evEbitda.toFixed(1), (r.revGrowth * 100).toFixed(1),
        (r.opMargin * 100).toFixed(1), (r.roic * 100).toFixed(1),
        (r.fcfYield * 100).toFixed(1), (r.momentum * 100).toFixed(1), r.composite.toFixed(0),
      ]),
    ])

  return (
    <Panel
      title={`Equity Screener — ${rows.length} of ${market.list.length} securities match`}
      className="h-full"
      right={<PanelButton onClick={exportCsv}>⬇ CSV</PanelButton>}
    >
      <div className="border-b border-line p-2 space-y-2">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-zinc-600 tracking-widest">PRESETS</span>
          {PRESETS.map((p) => (
            <PanelButton key={p.name} onClick={() => setC({ ...EMPTY, ...p.criteria })}>
              <span title={p.desc}>{p.name}</span>
            </PanelButton>
          ))}
          <PanelButton onClick={() => setC(EMPTY)}>CLEAR</PanelButton>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
          <label className="flex items-center gap-1 text-[10px] text-zinc-500">
            SECTOR
            <select
              value={c.sector}
              onChange={(e) => setC((p) => ({ ...p, sector: e.target.value }))}
              className="bg-black border border-line text-amber text-[11px] px-1 py-0.5 outline-none focus:border-amber"
            >
              <option value="">All</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <NumInput label="P/E ≤" value={c.maxPe} onChange={(v) => setC((p) => ({ ...p, maxPe: v }))} />
          <NumInput label="EV/EBITDA ≤" value={c.maxEvEbitda} onChange={(v) => setC((p) => ({ ...p, maxEvEbitda: v }))} />
          <NumInput label="REV GR ≥" value={c.minRevGrowth} onChange={(v) => setC((p) => ({ ...p, minRevGrowth: v }))} pct />
          <NumInput label="OP MGN ≥" value={c.minOpMargin} onChange={(v) => setC((p) => ({ ...p, minOpMargin: v }))} pct />
          <NumInput label="ROIC ≥" value={c.minRoic} onChange={(v) => setC((p) => ({ ...p, minRoic: v }))} pct />
          <NumInput label="FCF YLD ≥" value={c.minFcfYield} onChange={(v) => setC((p) => ({ ...p, minFcfYield: v }))} pct />
          <NumInput label="SCORE ≥" value={c.minComposite} onChange={(v) => setC((p) => ({ ...p, minComposite: v }))} />
        </div>
      </div>
      <table className="w-full text-[11px] tabular-nums">
        <thead className="sticky top-0 bg-panelhead">
          <tr className="text-zinc-500 border-b border-line">
            {header('TICKER', 'ticker')}
            <th className="px-2 py-1.5 font-normal text-left">NAME / SECTOR</th>
            {header('MKT CAP', 'mcap')}
            {header('P/E', 'pe')}
            {header('EV/EBITDA', 'evEbitda')}
            {header('REV GR', 'revGrowth')}
            {header('OP MGN', 'opMargin')}
            {header('ROIC', 'roic')}
            {header('FCF YLD', 'fcfYield')}
            {header('6M MOM', 'momentum')}
            {header('SCORE', 'composite')}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.ticker}
              onClick={() => execute(r.ticker)}
              className="border-b border-line/40 hover:bg-white/[0.04] cursor-pointer"
            >
              <td className="px-2 py-1 text-cyan-300 font-bold">{r.ticker}</td>
              <td className="px-2 py-1 text-zinc-500 truncate max-w-44">
                {r.sec.seed.name} <span className="text-zinc-700">· {r.sec.seed.sector}</span>
              </td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtMoney(r.mcap, 0)}</td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtNum(r.pe, 1)}</td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtNum(r.evEbitda, 1)}</td>
              <td className={`px-2 py-1 text-right ${chgClass(r.revGrowth)}`}>{fmtPct(r.revGrowth, 1)}</td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtPct(r.opMargin, 1)}</td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtPct(r.roic, 1)}</td>
              <td className="px-2 py-1 text-right text-zinc-300">{fmtPct(r.fcfYield, 1)}</td>
              <td className={`px-2 py-1 text-right ${chgClass(r.momentum)}`}>{fmtPct(r.momentum, 1, true)}</td>
              <td className="px-2 py-1 text-right">
                <span className={r.composite >= 60 ? 'text-up font-bold' : r.composite >= 40 ? 'text-warn' : 'text-down'}>
                  {r.composite.toFixed(0)}
                </span>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={11} className="text-center text-zinc-600 py-6">
                No securities match — relax a filter or hit CLEAR.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  )
}
