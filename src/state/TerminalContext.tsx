/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getMarket } from '../data/engine'
import { resolveFunction } from './registry'

export interface Holding {
  ticker: string
  shares: number
  costBasis: number // per share
}

interface View {
  func: string
  ticker: string | null
}

interface TerminalState {
  view: View
  /** Most recent message shown in the command bar status line. */
  message: string | null
  watchlist: string[]
  holdings: Holding[]
  execute: (input: string) => void
  navigate: (func: string, ticker?: string | null) => void
  goBack: () => void
  canGoBack: boolean
  toggleWatch: (ticker: string) => void
  setHoldings: (h: Holding[]) => void
  clearMessage: () => void
}

const TerminalContext = createContext<TerminalState | null>(null)

const WATCH_KEY = 'atlas.watchlist.v1'
const HOLD_KEY = 'atlas.holdings.v1'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JPM', 'XOM', 'LLY']
const DEFAULT_HOLDINGS: Holding[] = [
  { ticker: 'AAPL', shares: 120, costBasis: 155 },
  { ticker: 'MSFT', shares: 60, costBasis: 310 },
  { ticker: 'NVDA', shares: 250, costBasis: 45 },
  { ticker: 'JPM', shares: 80, costBasis: 165 },
  { ticker: 'XOM', shares: 150, costBasis: 95 },
  { ticker: 'COST', shares: 25, costBasis: 540 },
]

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>({ func: 'MOST', ticker: 'AAPL' })
  const [stack, setStack] = useState<View[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>(() => load(WATCH_KEY, DEFAULT_WATCHLIST))
  const [holdings, setHoldingsState] = useState<Holding[]>(() => load(HOLD_KEY, DEFAULT_HOLDINGS))

  const navigate = useCallback((func: string, ticker?: string | null) => {
    setView((prev) => {
      const next: View = { func, ticker: ticker === undefined ? prev.ticker : ticker }
      if (next.func === prev.func && next.ticker === prev.ticker) return prev
      setStack((s) => [...s.slice(-49), prev])
      return next
    })
    setMessage(null)
  }, [])

  const goBack = useCallback(() => {
    setStack((s) => {
      if (!s.length) return s
      setView(s[s.length - 1])
      return s.slice(0, -1)
    })
  }, [])

  const execute = useCallback(
    (input: string) => {
      const tokens = input.trim().toUpperCase().split(/\s+/).filter(Boolean)
      if (!tokens.length) return
      const market = getMarket()
      let ticker: string | null = null
      let funcToken: string | null = null
      for (const tok of tokens) {
        if (market.securities.has(tok) && !ticker) ticker = tok
        else if (resolveFunction(tok) && !funcToken) funcToken = tok
        else {
          setMessage(`Unknown command "${tok}" — type HELP for the function directory`)
          return
        }
      }
      const fn = funcToken ? resolveFunction(funcToken)! : null
      if (fn && fn.requiresSecurity) {
        setView((prev) => {
          const t = ticker ?? prev.ticker
          if (!t) {
            setMessage(`${fn.code} requires a security — try "AAPL ${fn.code}"`)
            return prev
          }
          setStack((s) => [...s.slice(-49), prev])
          return { func: fn.code, ticker: t }
        })
        setMessage(null)
      } else if (fn) {
        navigate(fn.code, ticker ?? undefined)
      } else if (ticker) {
        // Bare ticker: keep the current screen if security-scoped, else DES.
        setView((prev) => {
          const keepFunc = resolveFunction(prev.func)?.requiresSecurity ? prev.func : 'DES'
          setStack((s) => [...s.slice(-49), prev])
          return { func: keepFunc, ticker }
        })
        setMessage(null)
      }
    },
    [navigate],
  )

  const toggleWatch = useCallback((ticker: string) => {
    setWatchlist((w) => {
      const next = w.includes(ticker) ? w.filter((t) => t !== ticker) : [...w, ticker]
      localStorage.setItem(WATCH_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const setHoldings = useCallback((h: Holding[]) => {
    setHoldingsState(h)
    localStorage.setItem(HOLD_KEY, JSON.stringify(h))
  }, [])

  const clearMessage = useCallback(() => setMessage(null), [])

  const value = useMemo<TerminalState>(
    () => ({
      view, message, watchlist, holdings,
      execute, navigate, goBack, canGoBack: stack.length > 0,
      toggleWatch, setHoldings, clearMessage,
    }),
    [view, message, watchlist, holdings, execute, navigate, goBack, stack.length, toggleWatch, setHoldings, clearMessage],
  )

  return <TerminalContext.Provider value={value}>{children}</TerminalContext.Provider>
}

export function useTerminal(): TerminalState {
  const ctx = useContext(TerminalContext)
  if (!ctx) throw new Error('useTerminal must be used within TerminalProvider')
  return ctx
}
