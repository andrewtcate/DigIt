import { useMemo, useState } from 'react'
import type { Security } from '../data/types'
import { Panel, PanelButton, Stat } from '../components/Panel'
import {
  computeWacc, runDcf, dcfSensitivity, type DcfInputs,
} from '../lib/finance'
import { RISK_FREE_RATE, EQUITY_RISK_PREMIUM } from '../data/engine'
import { fmtMillions, fmtNum, fmtPct, fmtPrice, chgClass, downloadCsv } from '../lib/format'

interface Assumptions {
  revenueGrowthY1: number
  terminalGrowth: number
  ebitMargin: number
  taxRate: number
  capexPctRevenue: number
  beta: number
  riskFreeRate: number
  equityRiskPremium: number
  preTaxCostOfDebt: number
  projectionYears: number
}

function defaultAssumptions(security: Security): Assumptions {
  const ratios = security.financials.ratios.at(-1)!
  const seed = security.seed
  return {
    revenueGrowthY1: Math.min(Math.max(ratios.revenueGrowth, 0.0), 0.35),
    terminalGrowth: 0.025,
    ebitMargin: Math.max(ratios.operatingMargin, 0.02),
    taxRate: seed.taxRate,
    capexPctRevenue: Math.max(seed.capexPctRev, 0.01),
    beta: seed.beta,
    riskFreeRate: RISK_FREE_RATE,
    equityRiskPremium: EQUITY_RISK_PREMIUM,
    preTaxCostOfDebt: RISK_FREE_RATE + 0.012,
    projectionYears: 5,
  }
}

function Slider({ label, value, min, max, step, format, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="px-2 py-1">
      <div className="flex justify-between text-[11px] mb-0.5">
        <span className="text-zinc-500">{label}</span>
        <span className="text-amber tabular-nums font-semibold">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber h-1"
      />
    </div>
  )
}

/** DCF — interactive unlevered DCF with WACC build-up and sensitivity grid. */
export default function DCF({ security }: { security: Security }) {
  const [a, setA] = useState<Assumptions>(() => defaultAssumptions(security))
  const [secTicker, setSecTicker] = useState(security.seed.ticker)
  // Reset assumptions when the user switches securities on this screen.
  if (secTicker !== security.seed.ticker) {
    setSecTicker(security.seed.ticker)
    setA(defaultAssumptions(security))
  }

  const set = <K extends keyof Assumptions>(k: K) => (v: Assumptions[K]) => setA((p) => ({ ...p, [k]: v }))

  const model = useMemo(() => {
    const lastIs = security.financials.income.at(-1)!
    const lastCf = security.financials.cashFlow.at(-1)!
    const netDebtM = security.valuation.netDebt / 1e6
    const wacc = computeWacc({
      riskFreeRate: a.riskFreeRate,
      equityRiskPremium: a.equityRiskPremium,
      beta: a.beta,
      preTaxCostOfDebt: a.preTaxCostOfDebt,
      taxRate: a.taxRate,
      marketCap: security.quote.marketCap / 1e6,
      totalDebt: Math.max(netDebtM, 0) + lastIs.revenue * 0.06,
    })
    const inputs: DcfInputs = {
      baseRevenue: lastIs.revenue,
      revenueGrowthY1: a.revenueGrowthY1,
      terminalGrowth: a.terminalGrowth,
      ebitMargin: a.ebitMargin,
      taxRate: a.taxRate,
      capexPctRevenue: a.capexPctRevenue,
      depreciationPctRevenue: lastCf.depreciation / lastIs.revenue,
      nwcPctRevenueChange: 0.03,
      projectionYears: a.projectionYears,
      wacc: wacc.wacc,
      netDebt: netDebtM,
      sharesOutstanding: security.seed.sharesOut,
    }
    const result = runDcf(inputs)
    const waccSteps = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => wacc.wacc + d)
    const growthSteps = [-0.01, -0.005, 0, 0.005, 0.01].map((d) => a.terminalGrowth + d)
    const grid = dcfSensitivity(inputs, waccSteps, growthSteps)
    return { wacc, inputs, result, waccSteps, growthSteps, grid }
  }, [security, a])

  const px = security.quote.last
  const implied = model.result.impliedSharePrice
  const upside = implied / px - 1

  const exportCsv = () => {
    const header = ['Year', 'Revenue ($M)', 'Growth', 'EBIT ($M)', 'NOPAT ($M)', 'D&A ($M)', 'Capex ($M)', 'ΔNWC ($M)', 'FCFF ($M)', 'PV FCFF ($M)']
    const body = model.result.years.map((y) => [
      `Y${y.year}`, y.revenue.toFixed(0), (y.growth * 100).toFixed(1) + '%', y.ebit.toFixed(0),
      y.nopat.toFixed(0), y.depreciation.toFixed(0), y.capex.toFixed(0), y.deltaNwc.toFixed(0),
      y.fcff.toFixed(0), y.pvFcff.toFixed(0),
    ])
    downloadCsv(`${security.seed.ticker}_DCF.csv`, [header, ...body])
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 auto-rows-min">
      <Panel
        title="Assumptions"
        right={<PanelButton onClick={() => setA(defaultAssumptions(security))}>RESET</PanelButton>}
      >
        <div className="py-1">
          <Slider label="Revenue Growth (Yr 1, fades to terminal)" value={a.revenueGrowthY1} min={-0.10} max={0.60} step={0.005} format={(v) => fmtPct(v, 1)} onChange={set('revenueGrowthY1')} />
          <Slider label="Terminal Growth" value={a.terminalGrowth} min={0} max={0.045} step={0.0025} format={(v) => fmtPct(v, 2)} onChange={set('terminalGrowth')} />
          <Slider label="EBIT Margin" value={a.ebitMargin} min={0.01} max={0.60} step={0.005} format={(v) => fmtPct(v, 1)} onChange={set('ebitMargin')} />
          <Slider label="Tax Rate" value={a.taxRate} min={0.05} max={0.35} step={0.005} format={(v) => fmtPct(v, 1)} onChange={set('taxRate')} />
          <Slider label="Capex % of Revenue" value={a.capexPctRevenue} min={0.005} max={0.25} step={0.0025} format={(v) => fmtPct(v, 1)} onChange={set('capexPctRevenue')} />
          <Slider label="Projection Years" value={a.projectionYears} min={3} max={10} step={1} format={(v) => `${v}y`} onChange={set('projectionYears')} />
          <div className="border-t border-line mt-1 pt-1">
            <Slider label="Beta" value={a.beta} min={0.3} max={2.5} step={0.05} format={(v) => fmtNum(v, 2)} onChange={set('beta')} />
            <Slider label="Risk-Free Rate" value={a.riskFreeRate} min={0.01} max={0.08} step={0.001} format={(v) => fmtPct(v, 1)} onChange={set('riskFreeRate')} />
            <Slider label="Equity Risk Premium" value={a.equityRiskPremium} min={0.03} max={0.08} step={0.0025} format={(v) => fmtPct(v, 2)} onChange={set('equityRiskPremium')} />
            <Slider label="Pre-Tax Cost of Debt" value={a.preTaxCostOfDebt} min={0.02} max={0.10} step={0.0025} format={(v) => fmtPct(v, 2)} onChange={set('preTaxCostOfDebt')} />
          </div>
        </div>
      </Panel>

      <Panel title="Valuation Output" className="xl:col-span-2">
        <div className="grid grid-cols-3 gap-px bg-line text-center">
          {[
            { label: 'IMPLIED VALUE / SH', value: fmtPrice(implied), cls: 'text-amber text-xl' },
            { label: 'CURRENT PRICE', value: fmtPrice(px), cls: 'text-zinc-100 text-xl' },
            { label: upside >= 0 ? 'UPSIDE' : 'DOWNSIDE', value: fmtPct(upside, 1, true), cls: `${chgClass(upside)} text-xl` },
          ].map((c) => (
            <div key={c.label} className="bg-panel py-3">
              <div className={`font-bold tabular-nums ${c.cls}`}>{c.value}</div>
              <div className="text-[9px] text-zinc-500 tracking-widest mt-1">{c.label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 text-[11px] border-t border-line">
          <div className="border-r border-line py-1">
            <Stat label="Σ PV of FCFF" value={fmtMillions(model.result.sumPvFcff)} />
            <Stat label="PV of Terminal Value" value={fmtMillions(model.result.pvTerminalValue)} />
            <Stat label="Enterprise Value" value={fmtMillions(model.result.enterpriseValue)} valueClass="text-amber font-bold" />
            <Stat label="Less: Net Debt" value={fmtMillions(-model.inputs.netDebt)} />
            <Stat label="Equity Value" value={fmtMillions(model.result.equityValue)} valueClass="text-amber font-bold" />
            <Stat label="TV % of EV" value={fmtPct(model.result.terminalValuePctEv, 0)} valueClass={model.result.terminalValuePctEv > 0.8 ? 'text-warn' : 'text-zinc-100'} />
          </div>
          <div className="py-1">
            <Stat label="Cost of Equity (CAPM)" value={fmtPct(model.wacc.costOfEquity, 2)} />
            <Stat label="After-Tax Cost of Debt" value={fmtPct(model.wacc.afterTaxCostOfDebt, 2)} />
            <Stat label="Weight Equity / Debt" value={`${fmtPct(model.wacc.weightEquity, 0)} / ${fmtPct(model.wacc.weightDebt, 0)}`} />
            <Stat label="WACC" value={fmtPct(model.wacc.wacc, 2)} valueClass="text-amber font-bold" />
            <Stat label="Terminal Growth" value={fmtPct(a.terminalGrowth, 2)} />
            <Stat label="Shares Outstanding" value={`${fmtNum(security.seed.sharesOut, 0)}M`} />
          </div>
        </div>
        <div className="border-t border-line overflow-x-auto">
          <table className="w-full text-[11px] tabular-nums">
            <thead>
              <tr className="text-zinc-500 border-b border-line">
                {['', ...model.result.years.map((y) => `Y${y.year}`)].map((h, i) => (
                  <th key={i} className={`px-2 py-1 font-normal ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Revenue', vals: model.result.years.map((y) => fmtMillions(y.revenue, 0)) },
                { label: 'Growth', vals: model.result.years.map((y) => fmtPct(y.growth, 1)) },
                { label: 'EBIT', vals: model.result.years.map((y) => fmtMillions(y.ebit, 0)) },
                { label: 'NOPAT', vals: model.result.years.map((y) => fmtMillions(y.nopat, 0)) },
                { label: 'FCFF', vals: model.result.years.map((y) => fmtMillions(y.fcff, 0)) },
                { label: 'PV of FCFF', vals: model.result.years.map((y) => fmtMillions(y.pvFcff, 0)) },
              ].map((r) => (
                <tr key={r.label} className="border-b border-line/40 hover:bg-white/[0.03]">
                  <td className="px-2 py-0.5 text-zinc-400">{r.label}</td>
                  {r.vals.map((v, i) => (
                    <td key={i} className="px-2 py-0.5 text-right text-zinc-200">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-2 py-1 text-right">
          <PanelButton onClick={exportCsv}>⬇ EXPORT MODEL CSV</PanelButton>
        </div>
      </Panel>

      <Panel title="Sensitivity — Implied Price (WACC × Terminal g)">
        <table className="w-full text-[11px] tabular-nums text-center">
          <thead>
            <tr className="text-zinc-500 border-b border-line">
              <th className="px-1 py-1 font-normal text-left">WACC \ g</th>
              {model.growthSteps.map((g) => (
                <th key={g} className="px-1 py-1 font-normal">{fmtPct(g, 1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {model.waccSteps.map((w, ri) => (
              <tr key={w} className="border-b border-line/40">
                <td className="px-1 py-1 text-left text-zinc-500">{fmtPct(w, 1)}</td>
                {model.grid[ri].map((v, ci) => {
                  const isBase = ri === 2 && ci === 2
                  const rel = isFinite(v) ? v / px - 1 : NaN
                  return (
                    <td
                      key={ci}
                      className={`px-1 py-1 ${isBase ? 'bg-amber text-black font-bold' : chgClass(rel)}`}
                    >
                      {isFinite(v) ? fmtPrice(v) : '—'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-zinc-600 p-2">
          Green cells imply upside to the current price, red imply downside. Center cell is the
          base case. Cells where g approaches WACC are suppressed (model undefined).
        </p>
      </Panel>
    </div>
  )
}
