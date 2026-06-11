import { useMemo, useState } from 'react'
import { getNews } from '../data/news'
import { useTerminal } from '../state/TerminalContext'
import { Panel, PanelButton } from '../components/Panel'
import { fmtDate, fmtTime } from '../lib/format'
import type { NewsItem } from '../data/types'

const CATEGORIES: { id: NewsItem['category'] | ''; label: string }[] = [
  { id: '', label: 'ALL' },
  { id: 'earnings', label: 'EARNINGS' },
  { id: 'ratings', label: 'RATINGS' },
  { id: 'deals', label: 'DEALS' },
  { id: 'tech', label: 'TECH' },
  { id: 'markets', label: 'MARKETS' },
  { id: 'macro', label: 'MACRO' },
]

const CAT_COLORS: Record<NewsItem['category'], string> = {
  earnings: 'text-up',
  ratings: 'text-warn',
  deals: 'text-cyan-300',
  tech: 'text-violet-400',
  markets: 'text-amber',
  macro: 'text-blue-400',
  energy: 'text-orange-400',
}

/** N — newswire, optionally filtered to the active security. */
export default function NEWS({ ticker }: { ticker: string | null }) {
  const { execute } = useTerminal()
  const [cat, setCat] = useState<NewsItem['category'] | ''>('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [filterToTicker, setFilterToTicker] = useState(Boolean(ticker))

  const items = useMemo(() => {
    let xs = getNews()
    if (filterToTicker && ticker) xs = xs.filter((n) => n.tickers.includes(ticker))
    if (cat) xs = xs.filter((n) => n.category === cat)
    return xs
  }, [cat, ticker, filterToTicker])

  return (
    <Panel
      title={filterToTicker && ticker ? `Newswire — ${ticker}` : 'Newswire — All Securities'}
      className="h-full"
      right={
        <div className="flex gap-1 flex-wrap">
          {ticker && (
            <>
              <PanelButton active={filterToTicker} onClick={() => setFilterToTicker(true)}>{ticker}</PanelButton>
              <PanelButton active={!filterToTicker} onClick={() => setFilterToTicker(false)}>GLOBAL</PanelButton>
              <span className="w-2" />
            </>
          )}
          {CATEGORIES.map((c) => (
            <PanelButton key={c.label} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </PanelButton>
          ))}
        </div>
      }
    >
      {items.map((n) => {
        const open = openId === n.id
        return (
          <article key={n.id} className="border-b border-line/40">
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/[0.04] flex gap-3 items-baseline"
              onClick={() => setOpenId(open ? null : n.id)}
            >
              <span className="text-zinc-600 tabular-nums shrink-0 w-32">
                {fmtDate(n.ts)} {fmtTime(n.ts)}
              </span>
              <span className={`shrink-0 w-16 text-[9px] tracking-widest uppercase ${CAT_COLORS[n.category]}`}>
                {n.category}
              </span>
              {n.tickers[0] && (
                <span
                  className="text-cyan-300 font-bold shrink-0 hover:text-amber"
                  onClick={(e) => {
                    e.stopPropagation()
                    execute(n.tickers[0])
                  }}
                >
                  {n.tickers[0]}
                </span>
              )}
              <span className={`${open ? 'text-amber' : 'text-zinc-200'}`}>{n.headline}</span>
              <span className="text-zinc-600 shrink-0 ml-auto hidden md:inline">{n.source}</span>
            </button>
            {open && (
              <p className="px-3 pb-2 pl-[8.75rem] text-xs text-zinc-400 leading-relaxed max-w-4xl">
                {n.body}
              </p>
            )}
          </article>
        )
      })}
      {!items.length && (
        <p className="text-center text-zinc-600 text-xs py-8">No stories match this filter.</p>
      )}
    </Panel>
  )
}
