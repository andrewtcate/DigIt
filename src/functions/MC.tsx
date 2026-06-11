import { useEffect, useMemo, useRef, useState } from 'react'
import type { Security } from '../data/types'
import { Panel, PanelButton, Stat } from '../components/Panel'
import { monteCarloGbm, probAbove, dailyReturns, annualizedVol, annualizedReturn } from '../lib/finance'
import { fmtPct, fmtPrice, fmtNum } from '../lib/format'

const HORIZONS = [
  { label: '1M', days: 21 },
  { label: '3M', days: 63 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '2Y', days: 504 },
]

function FanChart({ bands, samplePaths, spot }: { bands: number[][]; samplePaths: number[][]; spot: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((es) => {
      const r = es[0].contentRect
      setSize({ w: Math.floor(r.width), h: Math.floor(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !size.w || !size.h) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size.w * dpr
    canvas.height = size.h * dpr
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.w, size.h)
    ctx.font = '10px "IBM Plex Mono", monospace'
    const W = size.w - 56
    const H = size.h - 8
    const n = bands.length
    const lo = Math.min(...bands.map((b) => b[0])) * 0.97
    const hi = Math.max(...bands.map((b) => b[4])) * 1.03
    const x = (i: number) => (i / (n - 1)) * W
    const y = (p: number) => H - ((p - lo) / (hi - lo)) * (H - 10) - 5

    const fillBand = (loIdx: number, hiIdx: number, color: string) => {
      ctx.beginPath()
      ctx.moveTo(x(0), y(bands[0][hiIdx]))
      for (let i = 1; i < n; i++) ctx.lineTo(x(i), y(bands[i][hiIdx]))
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(x(i), y(bands[i][loIdx]))
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }
    fillBand(0, 4, 'rgba(59,130,246,0.12)') // 5–95
    fillBand(1, 3, 'rgba(59,130,246,0.18)') // 25–75

    ctx.strokeStyle = 'rgba(148,163,184,0.25)'
    for (const path of samplePaths) {
      ctx.beginPath()
      ctx.moveTo(x(0), y(path[0]))
      for (let i = 1; i < path.length; i++) ctx.lineTo(x(i), y(path[i]))
      ctx.stroke()
    }

    // Median
    ctx.strokeStyle = '#ffb000'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(x(0), y(bands[0][2]))
    for (let i = 1; i < n; i++) ctx.lineTo(x(i), y(bands[i][2]))
    ctx.stroke()
    ctx.lineWidth = 1

    // Spot line
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, y(spot))
    ctx.lineTo(W, y(spot))
    ctx.stroke()
    ctx.setLineDash([])

    // Right axis labels at terminal percentiles
    const labels: [number, string][] = [
      [bands[n - 1][4], 'P95'],
      [bands[n - 1][3], 'P75'],
      [bands[n - 1][2], 'P50'],
      [bands[n - 1][1], 'P25'],
      [bands[n - 1][0], 'P5'],
    ]
    ctx.fillStyle = '#9ca3af'
    for (const [v, tag] of labels) {
      ctx.fillText(`${tag} ${fmtPrice(v)}`, W + 4, y(v) + 3)
    }
  }, [bands, samplePaths, spot, size])

  return (
    <div ref={wrapRef} className="w-full h-full">
      <canvas ref={ref} style={{ width: size.w, height: size.h }} />
    </div>
  )
}

function Histogram({ values, spot }: { values: number[]; spot: number }) {
  const bins = 41
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const counts = new Array<number>(bins).fill(0)
  for (const v of values) {
    const i = Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo || 1)) * bins))
    counts[i]++
  }
  const max = Math.max(...counts)
  return (
    <div className="flex items-end gap-px h-24 px-2">
      {counts.map((c, i) => {
        const binMid = lo + ((i + 0.5) / bins) * (hi - lo)
        return (
          <div
            key={i}
            title={fmtPrice(binMid)}
            className={`flex-1 ${binMid >= spot ? 'bg-up/60' : 'bg-down/60'}`}
            style={{ height: `${(c / max) * 100}%` }}
          />
        )
      })}
    </div>
  )
}

/** MC — Monte Carlo GBM fan chart, terminal distribution and probabilities. */
export default function MC({ security }: { security: Security }) {
  const [horizonIdx, setHorizonIdx] = useState(3)
  const [numPaths, setNumPaths] = useState(2000)
  const [useHistorical, setUseHistorical] = useState(true)
  const [driftOverride, setDriftOverride] = useState(0.08)
  const [volOverride, setVolOverride] = useState(0.30)
  const [target, setTarget] = useState(() => Math.round(security.quote.last * 1.2))

  const hist = useMemo(() => {
    const closes = security.candles.map((c) => c.c)
    const rets = dailyReturns(closes).slice(-504)
    return { drift: annualizedReturn(closes.slice(-504)), vol: annualizedVol(rets) }
  }, [security])

  const drift = useHistorical ? hist.drift : driftOverride
  const vol = useHistorical ? hist.vol : volOverride
  const days = HORIZONS[horizonIdx].days

  const sim = useMemo(
    () =>
      monteCarloGbm(
        security.quote.last, drift, vol, days, numPaths,
        `MC-${security.seed.ticker}-${days}-${numPaths}-${drift.toFixed(3)}-${vol.toFixed(3)}`,
      ),
    [security, drift, vol, days, numPaths],
  )

  const terminal = sim.terminalPrices
  const sorted = useMemo(() => [...terminal].sort((a, b) => a - b), [terminal])
  const pct = (p: number) => sorted[Math.min(Math.floor(p * sorted.length), sorted.length - 1)]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 h-full auto-rows-min">
      <Panel
        title={`Monte Carlo — ${numPaths.toLocaleString()} GBM paths, ${HORIZONS[horizonIdx].label} horizon`}
        className="xl:col-span-3 min-h-[420px]"
        right={
          <div className="flex gap-1 flex-wrap">
            {HORIZONS.map((h, i) => (
              <PanelButton key={h.label} active={i === horizonIdx} onClick={() => setHorizonIdx(i)}>
                {h.label}
              </PanelButton>
            ))}
            <span className="w-2" />
            {[1000, 2000, 5000].map((p) => (
              <PanelButton key={p} active={numPaths === p} onClick={() => setNumPaths(p)}>
                {p / 1000}K
              </PanelButton>
            ))}
          </div>
        }
      >
        <FanChart bands={sim.bands} samplePaths={sim.samplePaths} spot={security.quote.last} />
      </Panel>

      <div className="flex flex-col gap-2">
        <Panel title="Model Inputs">
          <div className="p-2 space-y-2 text-[11px]">
            <div className="flex gap-1">
              <PanelButton active={useHistorical} onClick={() => setUseHistorical(true)}>HISTORICAL</PanelButton>
              <PanelButton active={!useHistorical} onClick={() => setUseHistorical(false)}>MANUAL</PanelButton>
            </div>
            {useHistorical ? (
              <div className="text-zinc-500">
                Drift and volatility estimated from the trailing two years.
              </div>
            ) : (
              <>
                <label className="block">
                  <div className="flex justify-between text-zinc-500 mb-0.5">
                    <span>Drift (annual)</span>
                    <span className="text-amber">{fmtPct(driftOverride, 1)}</span>
                  </div>
                  <input type="range" min={-0.2} max={0.5} step={0.01} value={driftOverride}
                    onChange={(e) => setDriftOverride(Number(e.target.value))} className="w-full accent-amber h-1" />
                </label>
                <label className="block">
                  <div className="flex justify-between text-zinc-500 mb-0.5">
                    <span>Volatility (annual)</span>
                    <span className="text-amber">{fmtPct(volOverride, 1)}</span>
                  </div>
                  <input type="range" min={0.05} max={1.0} step={0.01} value={volOverride}
                    onChange={(e) => setVolOverride(Number(e.target.value))} className="w-full accent-amber h-1" />
                </label>
              </>
            )}
            <div className="border-t border-line pt-1">
              <Stat label="Drift μ" value={fmtPct(drift, 1)} />
              <Stat label="Vol σ" value={fmtPct(vol, 1)} />
            </div>
          </div>
        </Panel>

        <Panel title="Terminal Distribution">
          <Histogram values={terminal} spot={security.quote.last} />
          <div className="text-[11px] py-1 border-t border-line">
            <Stat label="Spot" value={fmtPrice(security.quote.last)} />
            <Stat label="Median (P50)" value={fmtPrice(pct(0.5))} />
            <Stat label="Mean E[S]" value={fmtPrice(sim.expectedTerminal)} />
            <Stat label="P5 / P95" value={`${fmtPrice(pct(0.05))} / ${fmtPrice(pct(0.95))}`} />
            <Stat label="P(above spot)" value={fmtPct(sim.probAboveSpot, 1)} valueClass={sim.probAboveSpot > 0.5 ? 'text-up' : 'text-down'} />
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 border-t border-line text-[11px]">
            <span className="text-zinc-500">P(S &gt;</span>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-20 bg-black border border-line px-1 py-0.5 text-amber outline-none focus:border-amber tabular-nums"
            />
            <span className="text-zinc-500">) =</span>
            <span className="text-amber font-bold tabular-nums">{fmtNum(probAbove(terminal, target) * 100, 1)}%</span>
          </div>
        </Panel>
      </div>
    </div>
  )
}
