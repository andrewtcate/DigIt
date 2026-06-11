/**
 * Quantitative finance library: return statistics, risk measures, CAPM/WACC,
 * DCF valuation, Black–Scholes option pricing and Monte Carlo simulation.
 */
import { Rng } from './random'

export const TRADING_DAYS = 252

// ---------------------------------------------------------------------------
// Return statistics
// ---------------------------------------------------------------------------

export function dailyReturns(closes: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < closes.length; i++) out.push(closes[i] / closes[i - 1] - 1)
  return out
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return NaN
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1))
}

export function covariance(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return NaN
  const mx = mean(xs.slice(0, n))
  const my = mean(ys.slice(0, n))
  let sum = 0
  for (let i = 0; i < n; i++) sum += (xs[i] - mx) * (ys[i] - my)
  return sum / (n - 1)
}

export function correlation(xs: number[], ys: number[]): number {
  return covariance(xs, ys) / (stdev(xs) * stdev(ys))
}

/** OLS beta of asset returns vs benchmark returns; also returns annualized alpha. */
export function regressBeta(
  asset: number[],
  benchmark: number[],
): { beta: number; alphaAnnual: number; r2: number } {
  const n = Math.min(asset.length, benchmark.length)
  const a = asset.slice(asset.length - n)
  const b = benchmark.slice(benchmark.length - n)
  const beta = covariance(a, b) / (stdev(b) ** 2)
  const alphaDaily = mean(a) - beta * mean(b)
  const r = correlation(a, b)
  return { beta, alphaAnnual: alphaDaily * TRADING_DAYS, r2: r * r }
}

export function annualizedReturn(closes: number[]): number {
  if (closes.length < 2) return NaN
  const total = closes[closes.length - 1] / closes[0]
  const years = (closes.length - 1) / TRADING_DAYS
  return Math.pow(total, 1 / years) - 1
}

export function annualizedVol(returns: number[]): number {
  return stdev(returns) * Math.sqrt(TRADING_DAYS)
}

export function sharpe(returns: number[], rfAnnual: number): number {
  const excess = mean(returns) * TRADING_DAYS - rfAnnual
  return excess / annualizedVol(returns)
}

export function sortino(returns: number[], rfAnnual: number): number {
  const downside = returns.filter((r) => r < 0)
  if (downside.length < 2) return NaN
  const dd = Math.sqrt(mean(downside.map((r) => r * r)) * TRADING_DAYS)
  return (mean(returns) * TRADING_DAYS - rfAnnual) / dd
}

export function maxDrawdown(closes: number[]): { drawdown: number; peakIdx: number; troughIdx: number } {
  let peak = closes[0]
  let peakIdx = 0
  let maxDd = 0
  let ddPeak = 0
  let ddTrough = 0
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > peak) {
      peak = closes[i]
      peakIdx = i
    }
    const dd = closes[i] / peak - 1
    if (dd < maxDd) {
      maxDd = dd
      ddPeak = peakIdx
      ddTrough = i
    }
  }
  return { drawdown: maxDd, peakIdx: ddPeak, troughIdx: ddTrough }
}

/** Historical Value-at-Risk (positive number = loss) at confidence level. */
export function historicalVaR(returns: number[], confidence = 0.95): number {
  if (!returns.length) return NaN
  const sorted = [...returns].sort((a, b) => a - b)
  const idx = Math.floor((1 - confidence) * sorted.length)
  return -sorted[Math.min(idx, sorted.length - 1)]
}

/** Conditional VaR / Expected Shortfall (positive number = loss). */
export function cvar(returns: number[], confidence = 0.95): number {
  if (!returns.length) return NaN
  const sorted = [...returns].sort((a, b) => a - b)
  const cut = Math.max(1, Math.floor((1 - confidence) * sorted.length))
  return -mean(sorted.slice(0, cut))
}

// ---------------------------------------------------------------------------
// Cost of capital & DCF
// ---------------------------------------------------------------------------

export interface WaccInputs {
  riskFreeRate: number
  equityRiskPremium: number
  beta: number
  preTaxCostOfDebt: number
  taxRate: number
  marketCap: number // same unit as totalDebt
  totalDebt: number
}

export interface WaccResult {
  costOfEquity: number
  afterTaxCostOfDebt: number
  weightEquity: number
  weightDebt: number
  wacc: number
}

export function computeWacc(i: WaccInputs): WaccResult {
  const costOfEquity = i.riskFreeRate + i.beta * i.equityRiskPremium
  const afterTaxCostOfDebt = i.preTaxCostOfDebt * (1 - i.taxRate)
  const total = i.marketCap + i.totalDebt
  const weightEquity = total > 0 ? i.marketCap / total : 1
  const weightDebt = 1 - weightEquity
  return {
    costOfEquity,
    afterTaxCostOfDebt,
    weightEquity,
    weightDebt,
    wacc: costOfEquity * weightEquity + afterTaxCostOfDebt * weightDebt,
  }
}

export interface DcfInputs {
  baseRevenue: number // $M, trailing fiscal year
  revenueGrowthY1: number // growth in projection year 1, fades to terminal
  terminalGrowth: number
  ebitMargin: number // operating margin applied across projection
  taxRate: number
  capexPctRevenue: number
  depreciationPctRevenue: number
  nwcPctRevenueChange: number // ΔNWC as % of revenue change
  projectionYears: number
  wacc: number
  netDebt: number // $M (debt minus cash)
  sharesOutstanding: number // millions
}

export interface DcfYear {
  year: number
  revenue: number
  growth: number
  ebit: number
  nopat: number
  depreciation: number
  capex: number
  deltaNwc: number
  fcff: number
  discountFactor: number
  pvFcff: number
}

export interface DcfResult {
  years: DcfYear[]
  sumPvFcff: number
  terminalValue: number
  pvTerminalValue: number
  enterpriseValue: number
  equityValue: number
  impliedSharePrice: number
  terminalValuePctEv: number
}

/** Unlevered (FCFF) DCF with linearly fading growth toward the terminal rate. */
export function runDcf(i: DcfInputs): DcfResult {
  const years: DcfYear[] = []
  let prevRevenue = i.baseRevenue
  let sumPvFcff = 0
  for (let y = 1; y <= i.projectionYears; y++) {
    const fade = i.projectionYears > 1 ? (y - 1) / (i.projectionYears - 1) : 0
    const growth = i.revenueGrowthY1 + (i.terminalGrowth - i.revenueGrowthY1) * fade
    const revenue = prevRevenue * (1 + growth)
    const ebit = revenue * i.ebitMargin
    const nopat = ebit * (1 - i.taxRate)
    const depreciation = revenue * i.depreciationPctRevenue
    const capex = revenue * i.capexPctRevenue
    const deltaNwc = (revenue - prevRevenue) * i.nwcPctRevenueChange
    const fcff = nopat + depreciation - capex - deltaNwc
    const discountFactor = 1 / Math.pow(1 + i.wacc, y)
    const pvFcff = fcff * discountFactor
    sumPvFcff += pvFcff
    years.push({ year: y, revenue, growth, ebit, nopat, depreciation, capex, deltaNwc, fcff, discountFactor, pvFcff })
    prevRevenue = revenue
  }
  const lastFcff = years[years.length - 1].fcff
  const spread = Math.max(i.wacc - i.terminalGrowth, 0.001)
  const terminalValue = (lastFcff * (1 + i.terminalGrowth)) / spread
  const pvTerminalValue = terminalValue * years[years.length - 1].discountFactor
  const enterpriseValue = sumPvFcff + pvTerminalValue
  const equityValue = enterpriseValue - i.netDebt
  return {
    years,
    sumPvFcff,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    equityValue,
    impliedSharePrice: equityValue / i.sharesOutstanding,
    terminalValuePctEv: pvTerminalValue / enterpriseValue,
  }
}

/** Implied share price across a WACC × terminal-growth grid. */
export function dcfSensitivity(
  base: DcfInputs,
  waccRange: number[],
  growthRange: number[],
): number[][] {
  return waccRange.map((w) =>
    growthRange.map((g) => {
      if (g >= w - 0.005) return NaN
      return runDcf({ ...base, wacc: w, terminalGrowth: g }).impliedSharePrice
    }),
  )
}

// ---------------------------------------------------------------------------
// Options: Black–Scholes
// ---------------------------------------------------------------------------

function normCdf(x: number): number {
  // Abramowitz & Stegun 7.1.26 approximation via erf.
  const t = 1 / (1 + 0.3275911 * Math.abs(x) * Math.SQRT1_2)
  const erf =
    1 -
    t *
      (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp(-(x * x) / 2)
  return 0.5 * (1 + (x >= 0 ? erf : -erf))
}

function normPdf(x: number): number {
  return Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)
}

export interface BsResult {
  price: number
  delta: number
  gamma: number
  vega: number // per 1 vol point (0.01)
  theta: number // per calendar day
  rho: number // per 1% rate move
}

export function blackScholes(
  type: 'call' | 'put',
  S: number,
  K: number,
  T: number, // years
  r: number,
  sigma: number,
  q = 0, // continuous dividend yield
): BsResult {
  if (T <= 0 || sigma <= 0) {
    const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)
    return { price: intrinsic, delta: NaN, gamma: NaN, vega: NaN, theta: NaN, rho: NaN }
  }
  const sqrtT = Math.sqrt(T)
  const d1 = (Math.log(S / K) + (r - q + (sigma * sigma) / 2) * T) / (sigma * sqrtT)
  const d2 = d1 - sigma * sqrtT
  const dfQ = Math.exp(-q * T)
  const dfR = Math.exp(-r * T)
  const gamma = (dfQ * normPdf(d1)) / (S * sigma * sqrtT)
  const vega = (S * dfQ * normPdf(d1) * sqrtT) / 100
  if (type === 'call') {
    const price = S * dfQ * normCdf(d1) - K * dfR * normCdf(d2)
    const theta =
      (-(S * dfQ * normPdf(d1) * sigma) / (2 * sqrtT) -
        r * K * dfR * normCdf(d2) +
        q * S * dfQ * normCdf(d1)) /
      365
    return { price, delta: dfQ * normCdf(d1), gamma, vega, theta, rho: (K * T * dfR * normCdf(d2)) / 100 }
  }
  const price = K * dfR * normCdf(-d2) - S * dfQ * normCdf(-d1)
  const theta =
    (-(S * dfQ * normPdf(d1) * sigma) / (2 * sqrtT) +
      r * K * dfR * normCdf(-d2) -
      q * S * dfQ * normCdf(-d1)) /
    365
  return {
    price,
    delta: -dfQ * normCdf(-d1),
    gamma,
    vega,
    theta,
    rho: (-K * T * dfR * normCdf(-d2)) / 100,
  }
}

// ---------------------------------------------------------------------------
// Monte Carlo simulation (GBM)
// ---------------------------------------------------------------------------

export interface MonteCarloResult {
  /** Percentile bands per step: [p5, p25, p50, p75, p95]. */
  bands: number[][]
  samplePaths: number[][]
  terminalPrices: number[]
  probAboveSpot: number
  expectedTerminal: number
}

export function monteCarloGbm(
  spot: number,
  driftAnnual: number,
  volAnnual: number,
  days: number,
  numPaths: number,
  seed: string,
  samplePathCount = 24,
): MonteCarloResult {
  const rng = new Rng(seed)
  const dt = 1 / TRADING_DAYS
  const drift = (driftAnnual - (volAnnual * volAnnual) / 2) * dt
  const diffusion = volAnnual * Math.sqrt(dt)
  const stepPrices: number[][] = Array.from({ length: days + 1 }, () => [])
  const samplePaths: number[][] = []
  const terminalPrices: number[] = []
  for (let p = 0; p < numPaths; p++) {
    let price = spot
    const keep = p < samplePathCount
    const path: number[] = keep ? [spot] : []
    stepPrices[0].push(spot)
    for (let d = 1; d <= days; d++) {
      price *= Math.exp(drift + diffusion * rng.normal())
      stepPrices[d].push(price)
      if (keep) path.push(price)
    }
    if (keep) samplePaths.push(path)
    terminalPrices.push(price)
  }
  const pcts = [0.05, 0.25, 0.5, 0.75, 0.95]
  const bands = stepPrices.map((prices) => {
    const sorted = [...prices].sort((a, b) => a - b)
    return pcts.map((p) => sorted[Math.min(Math.floor(p * sorted.length), sorted.length - 1)])
  })
  const above = terminalPrices.filter((p) => p > spot).length
  return {
    bands,
    samplePaths,
    terminalPrices,
    probAboveSpot: above / numPaths,
    expectedTerminal: mean(terminalPrices),
  }
}

/** Probability (from terminal distribution) of finishing above a target. */
export function probAbove(terminalPrices: number[], target: number): number {
  if (!terminalPrices.length) return NaN
  return terminalPrices.filter((p) => p > target).length / terminalPrices.length
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function percentileRank(values: number[], v: number): number {
  const valid = values.filter((x) => isFinite(x))
  if (!valid.length || !isFinite(v)) return NaN
  return valid.filter((x) => x <= v).length / valid.length
}

/** Piotroski-style composite quality score helpers live in the engine. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
