import { useEffect, useMemo, useRef, useState } from 'react'
import type { Candle } from '../data/types'
import { sma, ema, bollinger, rsi, macd } from '../lib/indicators'
import { fmtDateShort, fmtCompact, fmtPrice } from '../lib/format'

/* eslint-disable react-refresh/only-export-components -- chart options live with the chart */
export interface ChartOptions {
  sma50: boolean
  sma200: boolean
  ema21: boolean
  bollinger: boolean
  logScale: boolean
  subpane: 'none' | 'rsi' | 'macd'
}

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  sma50: true,
  sma200: true,
  ema21: false,
  bollinger: false,
  logScale: false,
  subpane: 'rsi',
}

interface Props {
  candles: Candle[]
  /** Number of trailing sessions to display. */
  range: number
  options?: ChartOptions
  /** Optional comparison series (e.g. index), rebased to the visible window. */
  compare?: { label: string; candles: Candle[] } | null
}

const COL = {
  up: '#22c55e',
  down: '#ef4444',
  grid: '#1c2430',
  axis: '#6b7280',
  amber: '#ffb000',
  blue: '#3b82f6',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  band: 'rgba(59,130,246,0.10)',
  crosshair: 'rgba(255,176,0,0.55)',
}

const RIGHT_AXIS = 58
const BOTTOM_AXIS = 18

function niceTicks(min: number, max: number, count = 6): number[] {
  const span = max - min
  if (span <= 0) return [min]
  const step = Math.pow(10, Math.floor(Math.log10(span / count)))
  const err = (count * step) / span
  const mult = err <= 0.15 ? 10 : err <= 0.35 ? 5 : err <= 0.75 ? 2 : 1
  const s = step * mult
  const ticks: number[] = []
  for (let v = Math.ceil(min / s) * s; v <= max; v += s) ticks.push(v)
  return ticks
}

export default function CandleChart({ candles, range, options = DEFAULT_CHART_OPTIONS, compare = null }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)

  const visible = useMemo(() => candles.slice(-range), [candles, range])

  // Indicators are computed on the full series, then sliced, so values at the
  // left edge of the window are correct.
  const studies = useMemo(() => {
    const closes = candles.map((c) => c.c)
    const cut = (xs: number[]) => xs.slice(-range)
    return {
      sma50: cut(sma(closes, 50)),
      sma200: cut(sma(closes, 200)),
      ema21: cut(ema(closes, 21)),
      boll: (() => {
        const b = bollinger(closes)
        return { upper: cut(b.upper), lower: cut(b.lower), middle: cut(b.middle) }
      })(),
      rsi: cut(rsi(closes)),
      macd: (() => {
        const m = macd(closes)
        return { macd: cut(m.macd), signal: cut(m.signal), histogram: cut(m.histogram) }
      })(),
    }
  }, [candles, range])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.w || !size.h || visible.length < 2) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    ctx.font = '10px "IBM Plex Mono", monospace'

    const W = size.w - RIGHT_AXIS
    const subH = options.subpane === 'none' ? 0 : Math.floor(size.h * 0.2)
    const mainH = size.h - BOTTOM_AXIS - subH
    const volH = Math.floor(mainH * 0.16)
    const priceH = mainH - volH

    const n = visible.length
    const slotW = W / n
    const bodyW = Math.max(1, Math.min(slotW * 0.65, 14))
    const xAt = (i: number) => (i + 0.5) * slotW

    // --- price scale -------------------------------------------------------
    let lo = Infinity
    let hi = -Infinity
    for (const c of visible) {
      lo = Math.min(lo, c.l)
      hi = Math.max(hi, c.h)
    }
    if (options.bollinger) {
      for (const v of studies.boll.upper) if (isFinite(v)) hi = Math.max(hi, v)
      for (const v of studies.boll.lower) if (isFinite(v)) lo = Math.min(lo, v)
    }
    const pad = (hi - lo) * 0.05
    lo -= pad
    hi += pad
    const tx = options.logScale ? Math.log : (v: number) => v
    const tLo = tx(Math.max(lo, 0.01))
    const tHi = tx(hi)
    const yAt = (price: number) => priceH - ((tx(Math.max(price, 0.01)) - tLo) / (tHi - tLo)) * priceH

    // --- grid + price axis -------------------------------------------------
    ctx.strokeStyle = COL.grid
    ctx.fillStyle = COL.axis
    ctx.lineWidth = 1
    for (const tick of niceTicks(lo, hi)) {
      const y = Math.round(yAt(tick)) + 0.5
      if (y < 4 || y > priceH - 2) continue
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
      ctx.fillText(fmtPrice(tick), W + 5, y + 3)
    }

    // --- time axis ---------------------------------------------------------
    const labelEvery = Math.ceil(n / Math.max(3, Math.floor(W / 90)))
    ctx.textAlign = 'center'
    for (let i = 0; i < n; i += labelEvery) {
      const x = Math.round(xAt(i)) + 0.5
      ctx.strokeStyle = COL.grid
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, mainH + subH)
      ctx.stroke()
      ctx.fillStyle = COL.axis
      ctx.fillText(fmtDateShort(visible[i].t), x, size.h - 5)
    }
    ctx.textAlign = 'left'

    // --- bollinger band fill -----------------------------------------------
    if (options.bollinger) {
      ctx.beginPath()
      let started = false
      for (let i = 0; i < n; i++) {
        const v = studies.boll.upper[i]
        if (!isFinite(v)) continue
        const x = xAt(i)
        if (!started) { ctx.moveTo(x, yAt(v)); started = true } else ctx.lineTo(x, yAt(v))
      }
      for (let i = n - 1; i >= 0; i--) {
        const v = studies.boll.lower[i]
        if (!isFinite(v)) continue
        ctx.lineTo(xAt(i), yAt(v))
      }
      ctx.closePath()
      ctx.fillStyle = COL.band
      ctx.fill()
    }

    // --- volume ------------------------------------------------------------
    const maxVol = Math.max(...visible.map((c) => c.v))
    for (let i = 0; i < n; i++) {
      const c = visible[i]
      const h = (c.v / maxVol) * (volH - 4)
      ctx.fillStyle = c.c >= c.o ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'
      ctx.fillRect(xAt(i) - bodyW / 2, priceH + volH - h, bodyW, h)
    }

    // --- candles -----------------------------------------------------------
    for (let i = 0; i < n; i++) {
      const c = visible[i]
      const x = xAt(i)
      const up = c.c >= c.o
      ctx.strokeStyle = up ? COL.up : COL.down
      ctx.fillStyle = up ? COL.up : COL.down
      ctx.beginPath()
      ctx.moveTo(x, yAt(c.h))
      ctx.lineTo(x, yAt(c.l))
      ctx.stroke()
      const yO = yAt(c.o)
      const yC = yAt(c.c)
      ctx.fillRect(x - bodyW / 2, Math.min(yO, yC), bodyW, Math.max(Math.abs(yC - yO), 1))
    }

    // --- overlays ----------------------------------------------------------
    const drawLine = (vals: number[], color: string, width = 1.3, yFn: (v: number) => number = yAt) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      let started = false
      for (let i = 0; i < n; i++) {
        const v = vals[i]
        if (!isFinite(v)) continue
        const x = xAt(i)
        if (!started) { ctx.moveTo(x, yFn(v)); started = true } else ctx.lineTo(x, yFn(v))
      }
      ctx.stroke()
      ctx.lineWidth = 1
    }
    if (options.sma50) drawLine(studies.sma50, COL.amber)
    if (options.sma200) drawLine(studies.sma200, COL.blue)
    if (options.ema21) drawLine(studies.ema21, COL.purple)
    if (options.bollinger) {
      drawLine(studies.boll.upper, 'rgba(59,130,246,0.6)', 1)
      drawLine(studies.boll.lower, 'rgba(59,130,246,0.6)', 1)
    }

    // --- comparison series (rebased % overlay) ------------------------------
    if (compare) {
      const cmp = compare.candles.slice(-range)
      if (cmp.length === n) {
        const base = cmp[0].c
        const ownBase = visible[0].c
        drawLine(cmp.map((c) => (c.c / base) * ownBase), COL.cyan, 1.2)
      }
    }

    // --- subpane -----------------------------------------------------------
    if (options.subpane !== 'none') {
      const top = mainH
      ctx.strokeStyle = '#2a3442'
      ctx.beginPath()
      ctx.moveTo(0, top + 0.5)
      ctx.lineTo(size.w, top + 0.5)
      ctx.stroke()
      if (options.subpane === 'rsi') {
        const yR = (v: number) => top + subH - (v / 100) * (subH - 6) - 3
        for (const lvl of [30, 70]) {
          ctx.strokeStyle = 'rgba(107,114,128,0.4)'
          ctx.setLineDash([3, 3])
          ctx.beginPath()
          ctx.moveTo(0, yR(lvl))
          ctx.lineTo(W, yR(lvl))
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = COL.axis
          ctx.fillText(String(lvl), W + 5, yR(lvl) + 3)
        }
        drawLine(studies.rsi, COL.purple, 1.2, yR)
        ctx.fillStyle = COL.purple
        ctx.fillText('RSI(14)', 4, top + 12)
      } else {
        const vals = [...studies.macd.macd, ...studies.macd.signal].filter(isFinite)
        const mLo = Math.min(...vals, 0)
        const mHi = Math.max(...vals, 0)
        const yM = (v: number) => top + subH - ((v - mLo) / (mHi - mLo || 1)) * (subH - 6) - 3
        for (let i = 0; i < n; i++) {
          const h = studies.macd.histogram[i]
          if (!isFinite(h)) continue
          ctx.fillStyle = h >= 0 ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'
          const y0 = yM(0)
          const y1 = yM(h)
          ctx.fillRect(xAt(i) - bodyW / 2, Math.min(y0, y1), bodyW, Math.abs(y1 - y0) || 1)
        }
        drawLine(studies.macd.macd, COL.cyan, 1.2, yM)
        drawLine(studies.macd.signal, COL.amber, 1.2, yM)
        ctx.fillStyle = COL.cyan
        ctx.fillText('MACD(12,26,9)', 4, top + 12)
      }
    }

    // --- last price marker --------------------------------------------------
    const last = visible[n - 1]
    const yLast = yAt(last.c)
    ctx.strokeStyle = 'rgba(255,176,0,0.35)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, yLast)
    ctx.lineTo(W, yLast)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COL.amber
    ctx.fillRect(W, yLast - 8, RIGHT_AXIS, 16)
    ctx.fillStyle = '#000'
    ctx.fillText(fmtPrice(last.c), W + 5, yLast + 3)

    // --- crosshair ----------------------------------------------------------
    if (hover && hover.x < W) {
      const i = Math.min(n - 1, Math.max(0, Math.floor(hover.x / slotW)))
      const x = Math.round(xAt(i)) + 0.5
      ctx.strokeStyle = COL.crosshair
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, mainH + subH)
      ctx.stroke()
      if (hover.y < priceH) {
        ctx.beginPath()
        ctx.moveTo(0, hover.y + 0.5)
        ctx.lineTo(W, hover.y + 0.5)
        ctx.stroke()
        const price = options.logScale
          ? Math.exp(tLo + ((priceH - hover.y) / priceH) * (tHi - tLo))
          : lo + ((priceH - hover.y) / priceH) * (hi - lo)
        ctx.setLineDash([])
        ctx.fillStyle = '#27303d'
        ctx.fillRect(W, hover.y - 8, RIGHT_AXIS, 16)
        ctx.fillStyle = '#e4e4e7'
        ctx.fillText(fmtPrice(price), W + 5, hover.y + 3)
      }
      ctx.setLineDash([])
      // OHLCV readout
      const c = visible[i]
      const chg = i > 0 ? c.c / visible[i - 1].c - 1 : 0
      const text = `${fmtDateShort(c.t)}  O ${fmtPrice(c.o)}  H ${fmtPrice(c.h)}  L ${fmtPrice(c.l)}  C ${fmtPrice(c.c)}  ${(chg * 100).toFixed(2)}%  V ${fmtCompact(c.v)}`
      ctx.fillStyle = 'rgba(10,14,20,0.92)'
      const tw = ctx.measureText(text).width
      ctx.fillRect(4, 2, tw + 12, 16)
      ctx.fillStyle = chg >= 0 ? COL.up : COL.down
      ctx.fillText(text, 10, 13)
    }
  }, [size, visible, studies, options, hover, compare, range])

  return (
    <div ref={wrapRef} className="relative w-full h-full min-h-0">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setHover({ x: e.clientX - r.left, y: e.clientY - r.top })
        }}
        onMouseLeave={() => setHover(null)}
      />
    </div>
  )
}
