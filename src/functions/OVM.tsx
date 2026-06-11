import { useMemo, useState } from 'react'
import type { Security } from '../data/types'
import { Panel, PanelButton, Stat } from '../components/Panel'
import { blackScholes, dailyReturns, annualizedVol } from '../lib/finance'
import { RISK_FREE_RATE } from '../data/engine'
import { fmtNum, fmtPct, fmtPrice } from '../lib/format'

const EXPIRIES = [
  { label: '1M', years: 1 / 12 },
  { label: '3M', years: 0.25 },
  { label: '6M', years: 0.5 },
  { label: '1Y', years: 1 },
  { label: '2Y', years: 2 },
]

/** Volatility smile: ATM vol from history, skewed for OTM puts / calls. */
function smileVol(baseVol: number, moneyness: number): number {
  // moneyness = K / S. Equity skew: higher IV for low strikes.
  const skew = -0.25 * (moneyness - 1)
  const convexity = 0.35 * (moneyness - 1) ** 2
  return Math.max(baseVol + skew * baseVol + convexity * baseVol, 0.05)
}

/** OVM — Black–Scholes pricer with greeks and a generated option chain. */
export default function OVM({ security }: { security: Security }) {
  const S = security.quote.last
  const q = security.seed.dividendYield

  const histVol = useMemo(() => {
    const rets = dailyReturns(security.candles.map((c) => c.c)).slice(-252)
    return annualizedVol(rets)
  }, [security])

  const [type, setType] = useState<'call' | 'put'>('call')
  const [strike, setStrike] = useState(() => Math.round(S))
  const [expIdx, setExpIdx] = useState(2)
  const [vol, setVol] = useState(() => Math.round(histVol * 100) / 100)
  const [rate, setRate] = useState(RISK_FREE_RATE)

  const T = EXPIRIES[expIdx].years
  const result = useMemo(() => blackScholes(type, S, strike, T, rate, vol, q), [type, S, strike, T, rate, vol, q])

  // Generated chain around the money with a volatility smile.
  const chain = useMemo(() => {
    const step = S > 500 ? 25 : S > 200 ? 10 : S > 50 ? 5 : 2.5
    const atm = Math.round(S / step) * step
    const strikes = Array.from({ length: 11 }, (_, i) => atm + (i - 5) * step)
    return strikes.map((K) => {
      const iv = smileVol(histVol, K / S)
      const call = blackScholes('call', S, K, T, rate, iv, q)
      const put = blackScholes('put', S, K, T, rate, iv, q)
      return { K, iv, call, put, isAtm: K === atm }
    })
  }, [S, T, rate, histVol, q])

  const intrinsic = type === 'call' ? Math.max(S - strike, 0) : Math.max(strike - S, 0)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 auto-rows-min">
      <Panel title="Black–Scholes Pricer">
        <div className="p-2 space-y-2 text-[11px]">
          <div className="flex gap-1">
            <PanelButton active={type === 'call'} onClick={() => setType('call')}>CALL</PanelButton>
            <PanelButton active={type === 'put'} onClick={() => setType('put')}>PUT</PanelButton>
            <span className="flex-1" />
            {EXPIRIES.map((e, i) => (
              <PanelButton key={e.label} active={i === expIdx} onClick={() => setExpIdx(i)}>
                {e.label}
              </PanelButton>
            ))}
          </div>
          <label className="block">
            <div className="flex justify-between text-zinc-500 mb-0.5">
              <span>Strike K</span>
              <span className="text-amber tabular-nums">{fmtPrice(strike)} ({fmtPct(strike / S - 1, 1, true)} vs spot)</span>
            </div>
            <input type="range" min={Math.round(S * 0.5)} max={Math.round(S * 1.5)} step={1} value={strike}
              onChange={(e) => setStrike(Number(e.target.value))} className="w-full accent-amber h-1" />
          </label>
          <label className="block">
            <div className="flex justify-between text-zinc-500 mb-0.5">
              <span>Implied Volatility σ</span>
              <span className="text-amber tabular-nums">{fmtPct(vol, 1)} (hist {fmtPct(histVol, 1)})</span>
            </div>
            <input type="range" min={0.05} max={1.2} step={0.01} value={vol}
              onChange={(e) => setVol(Number(e.target.value))} className="w-full accent-amber h-1" />
          </label>
          <label className="block">
            <div className="flex justify-between text-zinc-500 mb-0.5">
              <span>Risk-Free Rate r</span>
              <span className="text-amber tabular-nums">{fmtPct(rate, 2)}</span>
            </div>
            <input type="range" min={0} max={0.08} step={0.001} value={rate}
              onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-amber h-1" />
          </label>
          <div className="text-zinc-600">Dividend yield q = {fmtPct(q, 2)} (from security)</div>
        </div>
      </Panel>

      <Panel title={`${security.seed.ticker} ${fmtPrice(strike)} ${type.toUpperCase()} — ${EXPIRIES[expIdx].label}`}>
        <div className="text-center py-4 border-b border-line">
          <div className="text-3xl font-bold text-amber tabular-nums">{fmtPrice(result.price)}</div>
          <div className="text-[10px] text-zinc-500 tracking-widest mt-1">THEORETICAL VALUE</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Intrinsic {fmtPrice(intrinsic)} · Time value {fmtPrice(result.price - intrinsic)}
          </div>
        </div>
        <div className="text-[11px] py-1">
          <Stat label="Delta Δ" value={fmtNum(result.delta, 4)} />
          <Stat label="Gamma Γ" value={fmtNum(result.gamma, 5)} />
          <Stat label="Vega (per 1 vol pt)" value={fmtNum(result.vega, 4)} />
          <Stat label="Theta (per day)" value={fmtNum(result.theta, 4)} valueClass="text-down" />
          <Stat label="Rho (per 1% rate)" value={fmtNum(result.rho, 4)} />
          <Stat label="Breakeven at Expiry" value={fmtPrice(type === 'call' ? strike + result.price : strike - result.price)} />
        </div>
      </Panel>

      <Panel title={`Option Chain — ${EXPIRIES[expIdx].label} (modeled, vol smile)`}>
        <table className="w-full text-[10px] tabular-nums">
          <thead className="bg-panelhead">
            <tr className="text-zinc-500 border-b border-line">
              <th className="px-1 py-1 font-normal text-right">CALL Δ</th>
              <th className="px-1 py-1 font-normal text-right text-up">CALL</th>
              <th className="px-1 py-1 font-normal text-center">STRIKE</th>
              <th className="px-1 py-1 font-normal text-center">IV</th>
              <th className="px-1 py-1 font-normal text-right text-down">PUT</th>
              <th className="px-1 py-1 font-normal text-right">PUT Δ</th>
            </tr>
          </thead>
          <tbody>
            {chain.map((r) => (
              <tr
                key={r.K}
                onClick={() => setStrike(r.K)}
                className={`border-b border-line/40 cursor-pointer hover:bg-white/[0.04] ${r.isAtm ? 'bg-amber/10' : ''}`}
                title="Click to load strike into the pricer"
              >
                <td className="px-1 py-0.5 text-right text-zinc-500">{fmtNum(r.call.delta, 2)}</td>
                <td className="px-1 py-0.5 text-right text-up">{fmtPrice(r.call.price)}</td>
                <td className={`px-1 py-0.5 text-center font-bold ${r.isAtm ? 'text-amber' : 'text-zinc-200'}`}>{fmtPrice(r.K)}</td>
                <td className="px-1 py-0.5 text-center text-zinc-400">{fmtPct(r.iv, 0)}</td>
                <td className="px-1 py-0.5 text-right text-down">{fmtPrice(r.put.price)}</td>
                <td className="px-1 py-0.5 text-right text-zinc-500">{fmtNum(r.put.delta, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-600 px-2 py-1.5">
          Chain priced with a skewed smile around {fmtPct(histVol, 0)} ATM historical vol. Highlighted row is at-the-money.
        </p>
      </Panel>
    </div>
  )
}
