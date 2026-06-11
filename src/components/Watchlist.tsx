import { useTerminal } from '../state/TerminalContext'
import { getMarket } from '../data/engine'
import { fmtPrice, fmtPct, chgClass, fmtNum } from '../lib/format'
import Sparkline from './Sparkline'

/** Persistent left rail: composite index + user watchlist with sparklines. */
export default function Watchlist() {
  const { watchlist, view, execute, toggleWatch } = useTerminal()
  const market = getMarket()
  const idx = market.index

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-panel hidden lg:flex flex-col min-h-0">
      <div className="px-2 py-1 border-b border-line bg-panelhead">
        <div className="text-amber text-[11px] font-bold tracking-widest">MARKET MONITOR</div>
      </div>
      <button
        className="px-2 py-2 border-b border-line text-left hover:bg-white/5"
        onClick={() => execute('MOST')}
        title="Open market overview"
      >
        <div className="flex justify-between items-baseline">
          <span className="text-zinc-300 font-bold text-xs">{idx.code}</span>
          <span className="text-zinc-100 tabular-nums text-xs">{fmtNum(idx.last)}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <span className="text-[10px] text-zinc-500">{idx.name}</span>
          <span className={`text-[10px] tabular-nums ${chgClass(idx.change)}`}>{fmtPct(idx.changePct, 2, true)}</span>
        </div>
      </button>
      <div className="px-2 py-1 border-b border-line flex justify-between items-center">
        <span className="text-[10px] text-zinc-500 tracking-widest">WATCHLIST · {watchlist.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {watchlist.map((t) => {
          const sec = market.securities.get(t)
          if (!sec) return null
          const active = view.ticker === t
          const last30 = sec.candles.slice(-30).map((c) => c.c)
          return (
            <div
              key={t}
              className={`group flex items-center gap-1 px-2 py-1 border-b border-line/50 cursor-pointer ${
                active ? 'bg-amber/10 border-l-2 border-l-amber' : 'hover:bg-white/5 border-l-2 border-l-transparent'
              }`}
              onClick={() => execute(t)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`text-xs font-bold ${active ? 'text-amber' : 'text-zinc-200'}`}>{t}</span>
                  <span className="text-xs tabular-nums text-zinc-100">{fmtPrice(sec.quote.last)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <Sparkline values={last30} width={56} height={14} />
                  <span className={`text-[10px] tabular-nums ${chgClass(sec.quote.change)}`}>
                    {fmtPct(sec.quote.changePct, 2, true)}
                  </span>
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-down text-[10px] px-0.5"
                title={`Remove ${t} from watchlist`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleWatch(t)
                }}
              >
                ✕
              </button>
            </div>
          )
        })}
        {!watchlist.length && (
          <p className="text-[10px] text-zinc-600 p-2">
            Watchlist empty — open a security and press the ☆ in its header.
          </p>
        )}
      </div>
    </aside>
  )
}
