import { useEffect, useMemo, useRef, useState } from 'react'
import { useTerminal } from '../state/TerminalContext'
import { FUNCTIONS, resolveFunction } from '../state/registry'
import { getMarket } from '../data/engine'

interface Suggestion {
  insert: string
  label: string
  detail: string
  kind: 'ticker' | 'function'
}

/**
 * Bloomberg-style command line with fuzzy autocomplete — the part Bloomberg
 * gets right (speed) without the part it gets wrong (memorizing codes).
 * Accepts "TICKER", "TICKER FUNC", "FUNC", or fuzzy text like "apple dcf".
 */
export default function CommandBar() {
  const { execute, message, clearMessage, goBack, canGoBack } = useTerminal()
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState(0)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global shortcuts: "/" or Ctrl+K focuses the bar; Alt+Left goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
      }
      const fn = FUNCTIONS.find((f) => f.fkey === e.key)
      if (fn && !typing) {
        e.preventDefault()
        execute(fn.code)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [execute, goBack])

  const suggestions = useMemo<Suggestion[]>(() => {
    const trimmed = input.trim()
    if (!trimmed) return []
    const tokens = trimmed.toUpperCase().split(/\s+/)
    const lastToken = tokens[tokens.length - 1]
    const priorTokens = tokens.slice(0, -1)
    const prefix = priorTokens.length ? priorTokens.join(' ') + ' ' : ''
    const market = getMarket()
    const out: Suggestion[] = []
    const hasTicker = priorTokens.some((t) => market.securities.has(t))
    // Ticker + company-name matches.
    if (!hasTicker) {
      for (const s of market.list) {
        const tk = s.seed.ticker
        const matches = tk.startsWith(lastToken) || s.seed.name.toUpperCase().includes(lastToken)
        if (matches) out.push({ insert: prefix + tk, label: tk, detail: `${s.seed.name} · ${s.seed.sector}`, kind: 'ticker' })
        if (out.length >= 6) break
      }
    }
    // Function matches (by code, alias or plain-English name).
    const hasFunc = priorTokens.some((t) => resolveFunction(t))
    if (!hasFunc) {
      for (const f of FUNCTIONS) {
        const matches =
          f.code.startsWith(lastToken) ||
          f.aliases.some((a) => a.startsWith(lastToken)) ||
          f.name.toUpperCase().includes(lastToken)
        if (matches) out.push({ insert: prefix + f.code, label: f.code, detail: `${f.name} — ${f.description}`, kind: 'function' })
      }
    }
    return out.slice(0, 9)
  }, [input])

  const setInputAndResetSelection = (v: string) => {
    setInput(v)
    setSelected(0)
  }

  const run = (cmd: string) => {
    execute(cmd)
    setInput('')
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Tab' && suggestions.length) {
      e.preventDefault()
      setInputAndResetSelection(suggestions[selected].insert + ' ')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length && input.trim() && selected < suggestions.length) {
        // If the raw input already parses, prefer it; otherwise take the suggestion.
        const tokens = input.trim().toUpperCase().split(/\s+/)
        const market = getMarket()
        const parses = tokens.every((t) => market.securities.has(t) || resolveFunction(t))
        run(parses ? input : suggestions[selected].insert)
      } else if (input.trim()) {
        run(input)
      }
    } else if (e.key === 'Escape') {
      setInput('')
      clearMessage()
      inputRef.current?.blur()
    }
  }

  const showDropdown = focused && suggestions.length > 0

  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="flex items-center gap-2 bg-black border border-amber/50 px-2 h-8 focus-within:border-amber">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          title="Back (Alt+←)"
          className="text-amber/70 hover:text-amber disabled:text-zinc-700 text-sm leading-none"
        >
          ◀
        </button>
        <span className="text-amber font-bold select-none">›</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInputAndResetSelection(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder='Type a ticker or command — e.g. "NVDA DCF", "screen", "help"  ( / to focus )'
          spellCheck={false}
          className="flex-1 bg-transparent text-amber placeholder-zinc-600 outline-none text-sm font-medium tracking-wide uppercase"
        />
        <kbd className="text-[9px] text-zinc-600 border border-zinc-700 px-1 rounded hidden md:block">ENTER ↵</kbd>
      </div>
      {message && (
        <div className="absolute left-0 right-0 top-full mt-px bg-down/15 border border-down/50 text-down text-xs px-2 py-1 z-50">
          {message}
        </div>
      )}
      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full mt-px bg-black border border-amber/40 z-50 shadow-xl shadow-black/60">
          {suggestions.map((s, i) => (
            <li key={s.insert + s.label}>
              <button
                className={`w-full flex items-baseline gap-3 px-2 py-1 text-left text-xs ${
                  i === selected ? 'bg-amber/15' : 'hover:bg-white/5'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault()
                  run(s.insert)
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <span className={`font-bold w-14 shrink-0 ${s.kind === 'ticker' ? 'text-cyan-300' : 'text-amber'}`}>
                  {s.label}
                </span>
                <span className="text-zinc-400 truncate">{s.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
