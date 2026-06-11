/**
 * Deterministic market data engine.
 *
 * Generates five years of daily OHLCV, five fiscal years of financial
 * statements, quotes, valuation snapshots, factor scores and a cap-weighted
 * composite index for every company in the universe. Everything derives from
 * seeded PRNGs, so the dataset is stable across reloads — by design this is a
 * fully transparent, reproducible sandbox rather than a live feed. A data
 * adapter can later swap this module out for real vendor data without
 * touching the UI.
 */
import { Rng } from '../lib/random'
import { percentileRank, clamp } from '../lib/finance'
import { UNIVERSE } from './universe'
import type {
  Candle, CompanySeed, Financials, IncomeStatement, BalanceSheet,
  CashFlowStatement, RatioSet, Quote, Security, ValuationSnapshot, MarketIndex,
} from './types'

export const FISCAL_YEARS = [2021, 2022, 2023, 2024, 2025]
export const RISK_FREE_RATE = 0.042
export const EQUITY_RISK_PREMIUM = 0.05

const YEARS_OF_HISTORY = 5

// ---------------------------------------------------------------------------
// Trading calendar
// ---------------------------------------------------------------------------

/** Weekday timestamps (UTC midnight) for the last `years` years, oldest first. */
function buildTradingDays(years: number): number[] {
  const days: number[] = []
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  const start = new Date(end)
  start.setUTCFullYear(start.getUTCFullYear() - years)
  const d = new Date(start)
  while (d <= end) {
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(d.getTime())
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return days
}

const TRADING_DAY_TS = buildTradingDays(YEARS_OF_HISTORY)

// ---------------------------------------------------------------------------
// Price simulation
// ---------------------------------------------------------------------------

/**
 * GBM with stochastic volatility (mean-reverting vol multiplier), occasional
 * jumps, and a shared market factor so cross-sectional correlations are
 * realistic and betas are meaningful.
 */
function buildMarketFactor(): number[] {
  const rng = new Rng('MARKET-FACTOR-V1')
  const out: number[] = []
  let volMult = 1
  for (let i = 0; i < TRADING_DAY_TS.length; i++) {
    volMult += 0.05 * (1 - volMult) + 0.08 * rng.normal()
    volMult = clamp(volMult, 0.5, 2.6)
    const dailyVol = (0.15 / Math.sqrt(252)) * volMult
    let shock = rng.normal() * dailyVol
    if (rng.chance(0.004)) shock -= rng.range(0.015, 0.045) // market-wide jump days
    out.push(shock)
  }
  return out
}

const MARKET_FACTOR = buildMarketFactor()

function simulateCandles(seed: CompanySeed): Candle[] {
  const rng = new Rng(`PX-${seed.ticker}-V1`)
  const n = TRADING_DAY_TS.length
  const candles: Candle[] = []
  const dt = 1 / 252
  // Idiosyncratic vol is what's left after the market factor contribution.
  const marketVolContribution = seed.beta * 0.15
  const idioVol = Math.sqrt(Math.max(seed.vol ** 2 - marketVolContribution ** 2, 0.01))
  let price = seed.startPrice
  let volMult = 1
  const baseVolume = (seed.sharesOut * 1e6) * 0.006
  for (let i = 0; i < n; i++) {
    volMult += 0.04 * (1 - volMult) + 0.10 * rng.normal()
    volMult = clamp(volMult, 0.45, 3.0)
    const drift = (seed.drift - (seed.vol * seed.vol) / 2) * dt
    let ret = drift + seed.beta * MARKET_FACTOR[i] + idioVol * Math.sqrt(dt) * volMult * rng.normal()
    if (rng.chance(0.006)) ret += (rng.chance(0.45) ? 1 : -1) * rng.range(0.04, 0.11) // earnings-style gaps
    const open = price * (1 + rng.normal(0, 0.003))
    const close = price * Math.exp(ret)
    const intradayRange = Math.abs(ret) + rng.range(0.004, 0.014) * volMult
    const high = Math.max(open, close) * (1 + rng.range(0.1, 0.6) * intradayRange)
    const low = Math.min(open, close) * (1 - rng.range(0.1, 0.6) * intradayRange)
    const volume = Math.round(baseVolume * (0.55 + 5 * Math.abs(ret) + 0.5 * rng.uniform()) * volMult)
    candles.push({ t: TRADING_DAY_TS[i], o: open, h: high, l: low, c: close, v: volume })
    price = close
  }
  return candles
}

// ---------------------------------------------------------------------------
// Financial statements
// ---------------------------------------------------------------------------

function buildFinancials(seed: CompanySeed, lastPrice: number): Financials {
  const rng = new Rng(`FIN-${seed.ticker}-V1`)
  const income: IncomeStatement[] = []
  const balance: BalanceSheet[] = []
  const cashFlow: CashFlowStatement[] = []

  let revenue = seed.baseRevenue
  let shares = seed.sharesOut * 1.04 // modest historical buybacks
  for (let yi = 0; yi < FISCAL_YEARS.length; yi++) {
    const fy = FISCAL_YEARS[yi]
    if (yi > 0) revenue *= 1 + seed.revGrowth + rng.normal(0, Math.max(0.02, seed.revGrowth * 0.35))
    const gm = clamp(seed.grossMargin + rng.normal(0, 0.012) + yi * 0.002, 0.02, 0.99)
    const om = seed.opMargin + rng.normal(0, 0.012) + yi * 0.004
    const grossProfit = revenue * gm
    const operatingIncome = revenue * om
    const isTech = seed.sector === 'Technology' || seed.sector === 'Communication Services'
    const rdExpense = isTech ? revenue * rng.range(0.10, 0.16) : revenue * rng.range(0.005, 0.04)
    const sgaExpense = Math.max(grossProfit - operatingIncome - rdExpense, revenue * 0.01)
    const netDebt = revenue * seed.netDebtPctRev
    const grossDebt = Math.max(netDebt, 0) + revenue * 0.06
    const interestExpense = grossDebt * rng.range(0.032, 0.046)
    const pretaxIncome = operatingIncome - interestExpense + revenue * rng.normal(0.004, 0.003)
    const taxExpense = Math.max(pretaxIncome, 0) * seed.taxRate
    const netIncome = pretaxIncome - taxExpense
    const depreciation = revenue * Math.max(seed.capexPctRev * rng.range(0.75, 0.95), 0.015)
    const ebitda = operatingIncome + depreciation
    shares *= 1 - rng.range(0.002, 0.012) // buybacks shrink the float
    income.push({
      fiscalYear: fy, revenue, costOfRevenue: revenue - grossProfit, grossProfit,
      rdExpense, sgaExpense, operatingIncome, interestExpense, pretaxIncome,
      taxExpense, netIncome, eps: netIncome / shares, dilutedShares: shares,
      ebitda, depreciation,
    })

    const cash = Math.max(grossDebt - netDebt, revenue * 0.04)
    const receivables = revenue * rng.range(0.08, 0.14)
    const inventory = seed.grossMargin > 0.55 ? revenue * rng.range(0.01, 0.03) : revenue * rng.range(0.07, 0.13)
    const shortTermInvestments = cash * rng.range(0.25, 0.6)
    const totalCurrentAssets = cash + shortTermInvestments + receivables + inventory + revenue * 0.02
    const ppe = revenue * Math.max(seed.capexPctRev * rng.range(4, 6), 0.12)
    const goodwill = revenue * rng.range(0.05, 0.35)
    const totalAssets = totalCurrentAssets + ppe + goodwill + revenue * rng.range(0.06, 0.14)
    const accountsPayable = revenue * rng.range(0.06, 0.11)
    const shortTermDebt = grossDebt * 0.15
    const totalCurrentLiabilities = accountsPayable + shortTermDebt + revenue * rng.range(0.05, 0.10)
    const longTermDebt = grossDebt * 0.85
    const totalLiabilities = totalCurrentLiabilities + longTermDebt + revenue * rng.range(0.04, 0.10)
    balance.push({
      fiscalYear: fy, cashAndEquivalents: cash, shortTermInvestments, receivables, inventory,
      totalCurrentAssets, ppe, goodwill, totalAssets, accountsPayable, shortTermDebt,
      totalCurrentLiabilities, longTermDebt, totalLiabilities,
      totalEquity: totalAssets - totalLiabilities,
    })

    const stockComp = isTech ? revenue * rng.range(0.04, 0.08) : revenue * rng.range(0.004, 0.012)
    const workingCapitalChange = (yi === 0 ? 0 : revenue - income[yi - 1].revenue) * rng.range(0.01, 0.05)
    const operatingCashFlow = netIncome + depreciation + stockComp - workingCapitalChange
    const capex = revenue * seed.capexPctRev * rng.range(0.9, 1.1)
    const acquisitions = rng.chance(0.3) ? revenue * rng.range(0.005, 0.05) : 0
    const dividendsPaid = lastPrice * shares * seed.dividendYield
    const buybacks = Math.max(operatingCashFlow - capex, 0) * rng.range(0.2, 0.55)
    const debtIssued = rng.normal(0, revenue * 0.02)
    cashFlow.push({
      fiscalYear: fy, netIncome, depreciation, stockComp, workingCapitalChange,
      operatingCashFlow, capex, acquisitions,
      investingCashFlow: -(capex + acquisitions),
      dividendsPaid, buybacks, debtIssued,
      financingCashFlow: debtIssued - dividendsPaid - buybacks,
      freeCashFlow: operatingCashFlow - capex,
    })
  }

  const ratios: RatioSet[] = income.map((is, yi) => {
    const bs = balance[yi]
    const cf = cashFlow[yi]
    const prevIs = yi > 0 ? income[yi - 1] : null
    const netDebt = bs.shortTermDebt + bs.longTermDebt - bs.cashAndEquivalents - bs.shortTermInvestments
    const investedCapital = bs.totalEquity + bs.shortTermDebt + bs.longTermDebt - bs.cashAndEquivalents
    return {
      fiscalYear: is.fiscalYear,
      grossMargin: is.grossProfit / is.revenue,
      operatingMargin: is.operatingIncome / is.revenue,
      netMargin: is.netIncome / is.revenue,
      ebitdaMargin: is.ebitda / is.revenue,
      revenueGrowth: prevIs ? is.revenue / prevIs.revenue - 1 : NaN,
      epsGrowth: prevIs ? is.eps / prevIs.eps - 1 : NaN,
      roe: is.netIncome / bs.totalEquity,
      roa: is.netIncome / bs.totalAssets,
      roic: (is.operatingIncome * (1 - 0.21)) / investedCapital,
      currentRatio: bs.totalCurrentAssets / bs.totalCurrentLiabilities,
      quickRatio: (bs.totalCurrentAssets - bs.inventory) / bs.totalCurrentLiabilities,
      debtToEquity: (bs.shortTermDebt + bs.longTermDebt) / bs.totalEquity,
      netDebtToEbitda: netDebt / is.ebitda,
      interestCoverage: is.operatingIncome / Math.max(is.interestExpense, 0.01),
      assetTurnover: is.revenue / bs.totalAssets,
      fcfMargin: cf.freeCashFlow / is.revenue,
      fcfConversion: cf.freeCashFlow / Math.max(is.netIncome, 0.01),
    }
  })

  return { income, balance, cashFlow, ratios }
}

// ---------------------------------------------------------------------------
// Quote / valuation / scores
// ---------------------------------------------------------------------------

function buildQuote(seed: CompanySeed, candles: Candle[]): Quote {
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2]
  const yearSlice = candles.slice(-252)
  const vol30 = candles.slice(-30)
  return {
    ticker: seed.ticker,
    last: last.c,
    change: last.c - prev.c,
    changePct: last.c / prev.c - 1,
    open: last.o,
    dayHigh: last.h,
    dayLow: last.l,
    prevClose: prev.c,
    volume: last.v,
    avgVolume30d: vol30.reduce((a, c) => a + c.v, 0) / vol30.length,
    high52w: Math.max(...yearSlice.map((c) => c.h)),
    low52w: Math.min(...yearSlice.map((c) => c.l)),
    marketCap: last.c * seed.sharesOut * 1e6,
  }
}

function buildValuation(seed: CompanySeed, quote: Quote, fin: Financials): ValuationSnapshot {
  const is = fin.income[fin.income.length - 1]
  const bs = fin.balance[fin.balance.length - 1]
  const cf = fin.cashFlow[fin.cashFlow.length - 1]
  const ratios = fin.ratios[fin.ratios.length - 1]
  const netDebt = (bs.shortTermDebt + bs.longTermDebt - bs.cashAndEquivalents - bs.shortTermInvestments) * 1e6
  const ev = quote.marketCap + netDebt
  const pe = quote.last / is.eps
  const epsGrowth = isFinite(ratios.epsGrowth) ? ratios.epsGrowth : seed.revGrowth
  const fwdEps = is.eps * (1 + epsGrowth * 0.8)
  return {
    pe,
    forwardPe: quote.last / fwdEps,
    peg: epsGrowth > 0 ? pe / (epsGrowth * 100) : NaN,
    ps: quote.marketCap / (is.revenue * 1e6),
    pb: quote.marketCap / (bs.totalEquity * 1e6),
    evToEbitda: ev / (is.ebitda * 1e6),
    evToSales: ev / (is.revenue * 1e6),
    evToFcf: ev / (cf.freeCashFlow * 1e6),
    fcfYield: (cf.freeCashFlow * 1e6) / quote.marketCap,
    earningsYield: is.eps / quote.last,
    dividendYield: seed.dividendYield,
    enterpriseValue: ev,
    netDebt,
  }
}

function momentumReturn(candles: Candle[], days: number): number {
  if (candles.length <= days) return NaN
  return candles[candles.length - 1].c / candles[candles.length - 1 - days].c - 1
}

// ---------------------------------------------------------------------------
// Assembly (memoized singleton)
// ---------------------------------------------------------------------------

export interface Market {
  securities: Map<string, Security>
  list: Security[]
  index: MarketIndex
  tradingDays: number[]
}

let cached: Market | null = null

export function getMarket(): Market {
  if (cached) return cached

  const partials = UNIVERSE.map((seed) => {
    const candles = simulateCandles(seed)
    const quote = buildQuote(seed, candles)
    const financials = buildFinancials(seed, quote.last)
    const valuation = buildValuation(seed, quote, financials)
    return { seed, candles, quote, financials, valuation }
  })

  // Cross-sectional factor scores (percentile-based, 0–100).
  const earningsYields = partials.map((p) => p.valuation.earningsYield)
  const fcfYields = partials.map((p) => p.valuation.fcfYield)
  const revGrowths = partials.map((p) => p.financials.ratios.at(-1)!.revenueGrowth)
  const epsGrowths = partials.map((p) => p.financials.ratios.at(-1)!.epsGrowth)
  const roics = partials.map((p) => p.financials.ratios.at(-1)!.roic)
  const margins = partials.map((p) => p.financials.ratios.at(-1)!.operatingMargin)
  const mom6 = partials.map((p) => momentumReturn(p.candles, 126))
  const mom12 = partials.map((p) => momentumReturn(p.candles, 252))

  const securities = new Map<string, Security>()
  const list: Security[] = []
  for (let i = 0; i < partials.length; i++) {
    const p = partials[i]
    const value = 100 * (0.5 * percentileRank(earningsYields, earningsYields[i]) + 0.5 * percentileRank(fcfYields, fcfYields[i]))
    const growth = 100 * (0.5 * percentileRank(revGrowths, revGrowths[i]) + 0.5 * percentileRank(epsGrowths, epsGrowths[i]))
    const quality = 100 * (0.5 * percentileRank(roics, roics[i]) + 0.5 * percentileRank(margins, margins[i]))
    const momentum = 100 * (0.5 * percentileRank(mom6, mom6[i]) + 0.5 * percentileRank(mom12, mom12[i]))
    const composite = 0.3 * value + 0.25 * growth + 0.25 * quality + 0.2 * momentum
    const rng = new Rng(`ANALYST-${p.seed.ticker}-V1`)
    const upside = composite / 100 - 0.35 + rng.normal(0, 0.06)
    const rating: 'BUY' | 'HOLD' | 'SELL' = upside > 0.1 ? 'BUY' : upside < -0.05 ? 'SELL' : 'HOLD'
    const sec: Security = {
      ...p,
      scores: { value, growth, quality, momentum, composite },
      analyst: {
        rating,
        targetPrice: p.quote.last * (1 + clamp(upside, -0.25, 0.45)),
        numAnalysts: rng.int(18, 46),
      },
    }
    securities.set(p.seed.ticker, sec)
    list.push(sec)
  }

  // Cap-weighted composite index, rebased to 1000 at window start.
  const n = TRADING_DAY_TS.length
  const indexCandles: Candle[] = []
  const weights = list.map((s) => s.candles[0].c * s.seed.sharesOut)
  const totalW = weights.reduce((a, b) => a + b, 0)
  let rebase = 0
  for (let d = 0; d < n; d++) {
    let level = 0
    let open = 0
    let high = 0
    let low = 0
    let vol = 0
    for (let s = 0; s < list.length; s++) {
      const w = weights[s] / totalW
      const c = list[s].candles[d]
      const base = list[s].candles[0].c
      level += (w * c.c) / base
      open += (w * c.o) / base
      high += (w * c.h) / base
      low += (w * c.l) / base
      vol += c.v
    }
    if (d === 0) rebase = 1000 / level
    indexCandles.push({ t: TRADING_DAY_TS[d], o: open * rebase, h: high * rebase, l: low * rebase, c: level * rebase, v: vol })
  }
  const idxLast = indexCandles[indexCandles.length - 1]
  const idxPrev = indexCandles[indexCandles.length - 2]
  const index: MarketIndex = {
    code: 'ATX',
    name: 'ATLAS Composite 24',
    candles: indexCandles,
    last: idxLast.c,
    change: idxLast.c - idxPrev.c,
    changePct: idxLast.c / idxPrev.c - 1,
  }

  cached = { securities, list, index, tradingDays: TRADING_DAY_TS }
  return cached
}

export function getSecurity(ticker: string): Security | undefined {
  return getMarket().securities.get(ticker.toUpperCase())
}
