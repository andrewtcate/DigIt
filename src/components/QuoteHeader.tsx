import { useTerminal } from '../state/TerminalContext'
import type { Security } from '../data/types'
import { fmtPrice, fmtPct, fmtSigned, fmtMoney, fmtCompact, chgClass } from '../lib/format'
import { FUNCTIONS } from '../state/registry'

/** Security ribbon shown above security-scoped screens: quote + quick stats
 * + one-click function tabs. */
export default function QuoteHeader({ security }: { security: Security }) {
  const { view, execute, watchlist, toggleWatch } = useTerminal()
  const q = security.quote
  const s = security.seed
  const watched = watchlist.includes(s.ticker)
  const secFns = FUNCTIONS.filter((f) => f.requiresSecurity)

  return (
    <div className="border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleWatch(s.ticker)}
            title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            className={`text-base leading-none ${watched ? 'text-amber' : 'text-zinc-600 hover:text-amber'}`}
          >
            {watched ? '★' : '☆'}
          </button>
          <span className="text-amber font-bold text-lg tracking-wide">{s.ticker}</span>
          <span className="text-zinc-400 text-xs hidden sm:inline">{s.name}</span>
          <span className="text-[9px] text-zinc-600 border border-zinc-700 px-1 rounded">{s.sector}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-zinc-50 text-lg font-bold tabular-nums">{fmtPrice(q.last)}</span>
          <span className={`text-sm tabular-nums ${chgClass(q.change)}`}>
            {fmtSigned(q.change)} ({fmtPct(q.changePct, 2, true)})
          </span>
        </div>
        <div className="flex gap-4 text-[10px] text-zinc-500 tabular-nums ml-auto flex-wrap">
          <span>O <b className="text-zinc-300">{fmtPrice(q.open)}</b></span>
          <span>H <b className="text-zinc-300">{fmtPrice(q.dayHigh)}</b></span>
          <span>L <b className="text-zinc-300">{fmtPrice(q.dayLow)}</b></span>
          <span>VOL <b className="text-zinc-300">{fmtCompact(q.volume)}</b></span>
          <span>52W <b className="text-zinc-300">{fmtPrice(q.low52w)}–{fmtPrice(q.high52w)}</b></span>
          <span>MKT CAP <b className="text-zinc-300">{fmtMoney(q.marketCap)}</b></span>
        </div>
      </div>
      <nav className="flex border-t border-line overflow-x-auto">
        {secFns.map((f) => (
          <button
            key={f.code}
            onClick={() => execute(`${s.ticker} ${f.code}`)}
            className={`px-3 py-1 text-[10px] font-bold tracking-widest border-r border-line whitespace-nowrap ${
              view.func === f.code
                ? 'bg-amber text-black'
                : 'text-zinc-400 hover:text-amber hover:bg-white/5'
            }`}
            title={f.description}
          >
            {f.code}
          </button>
        ))}
        <button
          onClick={() => execute(`${s.ticker} N`)}
          className={`px-3 py-1 text-[10px] font-bold tracking-widest border-r border-line ${
            view.func === 'N' ? 'bg-amber text-black' : 'text-zinc-400 hover:text-amber hover:bg-white/5'
          }`}
          title="News for this security"
        >
          N
        </button>
      </nav>
    </div>
  )
}
