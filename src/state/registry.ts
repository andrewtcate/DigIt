/** Bloomberg-style function registry. Every screen is a typed command code. */

export interface TerminalFunction {
  code: string
  aliases: string[]
  name: string
  description: string
  /** Security-scoped functions need an active ticker; global ones don't. */
  requiresSecurity: boolean
  fkey?: string
}

export const FUNCTIONS: TerminalFunction[] = [
  { code: 'MOST', aliases: ['HOME', 'MOV'], name: 'Market Movers', description: 'Market overview, leaders and laggards', requiresSecurity: false, fkey: 'F1' },
  { code: 'DES', aliases: ['DESC'], name: 'Security Description', description: 'Company profile, key stats and snapshot', requiresSecurity: true, fkey: 'F2' },
  { code: 'GP', aliases: ['GIP', 'CHART'], name: 'Price Chart', description: 'Candlestick chart with technical studies', requiresSecurity: true, fkey: 'F3' },
  { code: 'FA', aliases: ['FIN'], name: 'Financial Analysis', description: 'Statements, ratios and trend analysis', requiresSecurity: true, fkey: 'F4' },
  { code: 'DCF', aliases: ['VAL'], name: 'DCF Valuation', description: 'Interactive discounted cash flow model', requiresSecurity: true, fkey: 'F5' },
  { code: 'COMP', aliases: ['RV'], name: 'Comparable Analysis', description: 'Relative valuation vs sector peers', requiresSecurity: true, fkey: 'F6' },
  { code: 'EQS', aliases: ['SCREEN', 'SCR'], name: 'Equity Screener', description: 'Multi-factor stock screening', requiresSecurity: false, fkey: 'F7' },
  { code: 'PORT', aliases: ['PRT', 'RISK'], name: 'Portfolio & Risk', description: 'Holdings, attribution, VaR and correlations', requiresSecurity: false, fkey: 'F8' },
  { code: 'MC', aliases: ['SIM'], name: 'Monte Carlo', description: 'Simulated price path distribution', requiresSecurity: true },
  { code: 'OVM', aliases: ['OPT', 'OVME'], name: 'Option Valuation', description: 'Black–Scholes pricer, greeks and chain', requiresSecurity: true },
  { code: 'N', aliases: ['NEWS', 'CN'], name: 'News', description: 'Newswire — global or filtered to security', requiresSecurity: false },
  { code: 'HELP', aliases: ['?', 'H'], name: 'Help & Guide', description: 'Command reference and keyboard shortcuts', requiresSecurity: false },
]

const byCode = new Map<string, TerminalFunction>()
for (const f of FUNCTIONS) {
  byCode.set(f.code, f)
  for (const a of f.aliases) byCode.set(a, f)
}

export function resolveFunction(token: string): TerminalFunction | undefined {
  return byCode.get(token.toUpperCase())
}
