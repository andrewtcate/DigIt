/** Synthetic newswire. Headlines are generated deterministically from the
 * same simulation seeds and tagged to tickers so panels can filter. */
import { Rng } from '../lib/random'
import { getMarket } from './engine'
import type { NewsItem } from './types'

const SOURCES = ['ATLAS Wire', 'Market Pulse', 'Capital Brief', 'The Ledger', 'StreetView', 'MacroDesk']

interface Template {
  category: NewsItem['category']
  make: (name: string, ticker: string, rng: Rng) => { headline: string; body: string }
}

const TEMPLATES: Template[] = [
  {
    category: 'earnings',
    make: (name, _t, rng) => {
      const beat = rng.chance(0.6)
      const pct = rng.range(1, 9).toFixed(1)
      return {
        headline: `${name} ${beat ? 'tops' : 'misses'} consensus estimates; revenue ${beat ? 'up' : 'down'} ${pct}% versus Street models`,
        body: `${name} reported quarterly results that ${beat ? 'exceeded' : 'fell short of'} analyst expectations, with management ${beat ? 'raising' : 'trimming'} full-year guidance. The desk flags ${beat ? 'expanding' : 'compressing'} operating margins as the key swing factor for next quarter's print.`,
      }
    },
  },
  {
    category: 'ratings',
    make: (name, ticker, rng) => {
      const up = rng.chance(0.55)
      const firm = rng.pick(['Harlan Securities', 'Beaumont Research', 'Crestline Partners', 'Vantage Equity', 'Northgate Capital'])
      return {
        headline: `${firm} ${up ? 'upgrades' : 'downgrades'} ${ticker} to ${up ? 'Overweight' : 'Underweight'}, citing ${up ? 'improving' : 'deteriorating'} fundamentals`,
        body: `${firm} moved ${name} to ${up ? 'Overweight' : 'Underweight'} this morning, pointing to ${up ? 'accelerating free cash flow conversion and a widening competitive moat' : 'rising input costs and slowing end-market demand'}. The firm's price target implies ${rng.range(5, 25).toFixed(0)}% ${up ? 'upside' : 'downside'} from the last close.`,
      }
    },
  },
  {
    category: 'deals',
    make: (name, _t, rng) => {
      const amt = rng.range(0.5, 12).toFixed(1)
      return {
        headline: `${name} said to weigh strategic options including a $${amt}B bolt-on acquisition`,
        body: `People familiar with the matter say ${name} has held early-stage talks with advisers about inorganic growth opportunities. Any transaction would likely be funded with a mix of balance-sheet cash and new debt, keeping leverage below management's stated ceiling.`,
      }
    },
  },
  {
    category: 'tech',
    make: (name, _t, rng) => {
      const area = rng.pick(['AI inference workloads', 'next-generation silicon', 'enterprise automation', 'edge computing', 'agentic software platforms'])
      return {
        headline: `${name} expands roadmap for ${area} in push to defend share`,
        body: `${name} outlined an expanded multi-year roadmap targeting ${area}, with executives framing the investment as accretive to long-run operating margins despite near-term capex pressure. Competitors are expected to respond with their own announcements within the quarter.`,
      }
    },
  },
  {
    category: 'markets',
    make: (name, ticker, rng) => {
      const flow = rng.chance(0.5) ? 'unusually heavy call buying' : 'a spike in short interest'
      return {
        headline: `Options desks flag ${flow} in ${ticker} ahead of catalyst window`,
        body: `Derivatives strategists note ${flow} in ${name}, with implied volatility for the front-month contract trading rich to its one-year average. Positioning suggests traders are bracing for an outsized move on the next scheduled catalyst.`,
      }
    },
  },
]

const MACRO_HEADLINES: { headline: string; body: string }[] = [
  {
    headline: 'Fed officials signal patience on rate path as inflation cools toward target',
    body: 'Several policymakers reiterated a data-dependent stance, noting that disinflation remains on track while labor markets stay resilient. Futures now price two cuts over the next twelve months, down from three a month ago.',
  },
  {
    headline: 'Treasury curve steepens as long-end yields rise on supply concerns',
    body: 'The 2s10s spread widened to its steepest level in months as dealers absorbed heavy issuance. Strategists say term premium is being rebuilt after years of compression, with implications for equity duration trades.',
  },
  {
    headline: 'Dollar softens against majors as risk appetite improves across sessions',
    body: 'The greenback slipped against the euro and yen as global growth indicators surprised to the upside. EM currencies extended gains, easing financial conditions for dollar-funded borrowers.',
  },
  {
    headline: 'Crude steadies near recent range as OPEC+ holds production guidance',
    body: 'Oil traded in a narrow band after the producer group reaffirmed output targets. Inventory draws in the U.S. were offset by softer demand signals from Asia, leaving the supply-demand balance roughly neutral.',
  },
  {
    headline: 'AI capex supercycle shows no sign of slowing, hyperscaler guidance suggests',
    body: 'Combined infrastructure spending guidance from the largest cloud platforms points to another record year, sustaining demand across semiconductors, power equipment and data-center REITs.',
  },
  {
    headline: 'Labor market cools gradually; quits rate falls to pre-pandemic norms',
    body: 'Job openings declined for a third straight month while layoffs stayed historically low — the soft-landing mix policymakers were hoping for. Wage growth continues to moderate toward productivity-consistent levels.',
  },
]

let cachedNews: NewsItem[] | null = null

export function getNews(): NewsItem[] {
  if (cachedNews) return cachedNews
  const market = getMarket()
  const rng = new Rng('NEWSWIRE-V1')
  const now = Date.now()
  const items: NewsItem[] = []
  let id = 0
  // Company stories spread over the last ~10 days.
  for (const sec of market.list) {
    const count = rng.int(2, 4)
    for (let i = 0; i < count; i++) {
      const tpl = rng.pick(TEMPLATES)
      const { headline, body } = tpl.make(sec.seed.name, sec.seed.ticker, rng)
      items.push({
        id: `n${id++}`,
        ts: now - rng.range(0.2, 240) * 3600_000,
        headline,
        source: rng.pick(SOURCES),
        tickers: [sec.seed.ticker],
        category: tpl.category,
        body,
      })
    }
  }
  for (const m of MACRO_HEADLINES) {
    items.push({
      id: `n${id++}`,
      ts: now - rng.range(0.2, 96) * 3600_000,
      headline: m.headline,
      source: 'MacroDesk',
      tickers: [],
      category: 'macro',
      body: m.body,
    })
  }
  items.sort((a, b) => b.ts - a.ts)
  cachedNews = items
  return items
}
