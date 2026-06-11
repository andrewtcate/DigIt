export interface CompanySeed {
  ticker: string
  name: string
  sector: string
  industry: string
  description: string
  hq: string
  founded: number
  employees: number
  ceo: string
  website: string
  /** FY2021 revenue, $M — anchor for the statement generator. */
  baseRevenue: number
  /** Average annual revenue growth across the 5 generated fiscal years. */
  revGrowth: number
  grossMargin: number
  opMargin: number
  taxRate: number
  /** Net debt as a fraction of revenue (negative = net cash). */
  netDebtPctRev: number
  capexPctRev: number
  /** Equity beta used for price simulation and CAPM. */
  beta: number
  /** Annualized volatility of the simulated price series. */
  vol: number
  /** Annualized drift of the simulated price series. */
  drift: number
  /** Price at the start of the simulation window. */
  startPrice: number
  /** Shares outstanding, millions. */
  sharesOut: number
  dividendYield: number
}

export interface Candle {
  /** UTC ms timestamp at market close date. */
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface Quote {
  ticker: string
  last: number
  change: number
  changePct: number
  open: number
  dayHigh: number
  dayLow: number
  prevClose: number
  volume: number
  avgVolume30d: number
  high52w: number
  low52w: number
  marketCap: number // $
}

export interface IncomeStatement {
  fiscalYear: number
  revenue: number
  costOfRevenue: number
  grossProfit: number
  rdExpense: number
  sgaExpense: number
  operatingIncome: number
  interestExpense: number
  pretaxIncome: number
  taxExpense: number
  netIncome: number
  eps: number
  dilutedShares: number
  ebitda: number
  depreciation: number
}

export interface BalanceSheet {
  fiscalYear: number
  cashAndEquivalents: number
  shortTermInvestments: number
  receivables: number
  inventory: number
  totalCurrentAssets: number
  ppe: number
  goodwill: number
  totalAssets: number
  accountsPayable: number
  shortTermDebt: number
  totalCurrentLiabilities: number
  longTermDebt: number
  totalLiabilities: number
  totalEquity: number
}

export interface CashFlowStatement {
  fiscalYear: number
  netIncome: number
  depreciation: number
  stockComp: number
  workingCapitalChange: number
  operatingCashFlow: number
  capex: number
  acquisitions: number
  investingCashFlow: number
  dividendsPaid: number
  buybacks: number
  debtIssued: number
  financingCashFlow: number
  freeCashFlow: number
}

export interface RatioSet {
  fiscalYear: number
  grossMargin: number
  operatingMargin: number
  netMargin: number
  ebitdaMargin: number
  revenueGrowth: number
  epsGrowth: number
  roe: number
  roa: number
  roic: number
  currentRatio: number
  quickRatio: number
  debtToEquity: number
  netDebtToEbitda: number
  interestCoverage: number
  assetTurnover: number
  fcfMargin: number
  fcfConversion: number
}

export interface Financials {
  income: IncomeStatement[]
  balance: BalanceSheet[]
  cashFlow: CashFlowStatement[]
  ratios: RatioSet[]
}

export interface ValuationSnapshot {
  pe: number
  forwardPe: number
  peg: number
  ps: number
  pb: number
  evToEbitda: number
  evToSales: number
  evToFcf: number
  fcfYield: number
  earningsYield: number
  dividendYield: number
  enterpriseValue: number
  netDebt: number
}

export interface Security {
  seed: CompanySeed
  candles: Candle[]
  quote: Quote
  financials: Financials
  valuation: ValuationSnapshot
  /** Composite 0-100 factor scores. */
  scores: { value: number; growth: number; quality: number; momentum: number; composite: number }
  analyst: { rating: 'BUY' | 'HOLD' | 'SELL'; targetPrice: number; numAnalysts: number }
}

export interface NewsItem {
  id: string
  ts: number
  headline: string
  source: string
  tickers: string[]
  category: 'earnings' | 'macro' | 'deals' | 'tech' | 'energy' | 'ratings' | 'markets'
  body: string
}

export interface MarketIndex {
  code: string
  name: string
  candles: Candle[]
  last: number
  change: number
  changePct: number
}
