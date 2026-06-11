import { useMemo, useState } from 'react'
import type { Security } from '../data/types'
import { getMarket } from '../data/engine'
import { Panel, PanelButton, Stat } from '../components/Panel'
import CandleChart, { DEFAULT_CHART_OPTIONS, type ChartOptions } from '../components/CandleChart'
import { rsi, macd, sma, rollingVol, atr } from '../lib/indicators'
import { fmtNum, fmtPct, fmtPrice, chgClass } from '../lib/format'

const RANGES = [
  { label: '1M', days: 22 },
  { label: '3M', days: 66 },
  { label: '6M', days: 126 },
  { label: '1Y', days: 252 },
  { label: '2Y', days: 504 },
  { label: '5Y', days: 1300 },
]

/** GP — full charting workstation: candles, studies, signal summary. */
export default function GP({ security }: { security: Security }) {
  const market = getMarket()
  const [rangeIdx, setRangeIdx] = useState(3)
  const [opts, setOpts] = useState<ChartOptions>({ ...DEFAULT_CHART_OPTIONS })
  const [showIndex, setShowIndex] = useState(false)

  const toggle = (key: keyof ChartOptions) =>
    setOpts((o) => ({ ...o, [key]: !o[key] }))

  const signals = useMemo(() => {
    const closes = security.candles.map((c) => c.c)
    const highs = security.candles.map((c) => c.h)
    const lows = security.candles.map((c) => c.l)
    const last = closes.length - 1
    const r = rsi(closes)[last]
    const m = macd(closes)
    const sma50v = sma(closes, 50)[last]
    const sma200v = sma(closes, 200)[last]
    const vol = rollingVol(closes)[last]
    const atr14 = atr(highs, lows, closes)[last]
    const px = closes[last]
    return {
      rsi: r,
      rsiSignal: r > 70 ? 'OVERBOUGHT' : r < 30 ? 'OVERSOLD' : 'NEUTRAL',
      macdHist: m.histogram[last],
      macdSignal: m.histogram[last] > 0 ? 'BULLISH' : 'BEARISH',
      sma50: sma50v,
      sma200: sma200v,
      trend: sma50v > sma200v ? 'GOLDEN CROSS' : 'DEATH CROSS',
      above50: px > sma50v,
      above200: px > sma200v,
      vol21: vol,
      atr14,
      ret1m: px / closes[last - 22] - 1,
      ret3m: px / closes[last - 66] - 1,
      ret6m: px / closes[last - 126] - 1,
      ret1y: px / closes[last - 252] - 1,
    }
  }, [security])

  const signalClass = (good: boolean) => (good ? 'text-up' : 'text-down')

  return (
    <div className="flex flex-col xl:flex-row gap-2 h-full min-h-0">
      <Panel
        title={`${security.seed.ticker} — Price & Studies`}
        className="flex-1 min-h-[420px]"
        right={
          <div className="flex gap-1 flex-wrap">
            {RANGES.map((r, i) => (
              <PanelButton key={r.label} active={i === rangeIdx} onClick={() => setRangeIdx(i)}>
                {r.label}
              </PanelButton>
            ))}
            <span className="w-2" />
            <PanelButton active={opts.sma50} onClick={() => toggle('sma50')}>SMA50</PanelButton>
            <PanelButton active={opts.sma200} onClick={() => toggle('sma200')}>SMA200</PanelButton>
            <PanelButton active={opts.ema21} onClick={() => toggle('ema21')}>EMA21</PanelButton>
            <PanelButton active={opts.bollinger} onClick={() => toggle('bollinger')}>BOLL</PanelButton>
            <PanelButton active={showIndex} onClick={() => setShowIndex((v) => !v)}>VS ATX</PanelButton>
            <PanelButton active={opts.logScale} onClick={() => toggle('logScale')}>LOG</PanelButton>
            <span className="w-2" />
            <PanelButton active={opts.subpane === 'rsi'} onClick={() => setOpts((o) => ({ ...o, subpane: o.subpane === 'rsi' ? 'none' : 'rsi' }))}>RSI</PanelButton>
            <PanelButton active={opts.subpane === 'macd'} onClick={() => setOpts((o) => ({ ...o, subpane: o.subpane === 'macd' ? 'none' : 'macd' }))}>MACD</PanelButton>
          </div>
        }
      >
        <CandleChart
          candles={security.candles}
          range={RANGES[rangeIdx].days}
          options={opts}
          compare={showIndex ? { label: 'ATX', candles: market.index.candles } : null}
        />
      </Panel>

      <div className="w-full xl:w-64 shrink-0 flex flex-col gap-2">
        <Panel title="Technical Summary">
          <div className="text-[11px] py-1">
            <Stat label="RSI (14)" value={`${fmtNum(signals.rsi, 1)} · ${signals.rsiSignal}`}
              valueClass={signals.rsiSignal === 'NEUTRAL' ? 'text-zinc-100' : 'text-warn'} />
            <Stat label="MACD Histogram" value={`${fmtNum(signals.macdHist, 2)} · ${signals.macdSignal}`}
              valueClass={signalClass(signals.macdHist > 0)} />
            <Stat label="SMA 50" value={fmtPrice(signals.sma50)} valueClass={signalClass(signals.above50)} />
            <Stat label="SMA 200" value={fmtPrice(signals.sma200)} valueClass={signalClass(signals.above200)} />
            <Stat label="Trend Regime" value={signals.trend} valueClass={signalClass(signals.trend === 'GOLDEN CROSS')} />
            <Stat label="Realized Vol (21d)" value={fmtPct(signals.vol21, 1)} />
            <Stat label="ATR (14)" value={fmtPrice(signals.atr14)} />
          </div>
        </Panel>
        <Panel title="Performance">
          <div className="text-[11px] py-1">
            <Stat label="1 Month" value={fmtPct(signals.ret1m, 1, true)} valueClass={chgClass(signals.ret1m)} />
            <Stat label="3 Months" value={fmtPct(signals.ret3m, 1, true)} valueClass={chgClass(signals.ret3m)} />
            <Stat label="6 Months" value={fmtPct(signals.ret6m, 1, true)} valueClass={chgClass(signals.ret6m)} />
            <Stat label="1 Year" value={fmtPct(signals.ret1y, 1, true)} valueClass={chgClass(signals.ret1y)} />
          </div>
        </Panel>
        <Panel title="Legend">
          <div className="text-[10px] text-zinc-500 p-2 space-y-1">
            <p><span className="text-amber">—</span> SMA 50 &nbsp; <span className="text-blue-400">—</span> SMA 200 &nbsp; <span className="text-violet-400">—</span> EMA 21</p>
            <p><span className="text-cyan-300">—</span> ATX index (rebased) &nbsp; <span className="text-blue-400">▒</span> Bollinger 20/2σ</p>
            <p>Hover the chart for OHLCV crosshair readout.</p>
          </div>
        </Panel>
      </div>
    </div>
  )
}
