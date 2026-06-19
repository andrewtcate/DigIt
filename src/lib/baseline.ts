// Price-baseline learning + "unusually cheap" detection.
//
// LIMITATION (documented): cheap-fare APIs don't expose a "normal" price for a
// route. So FareScout learns its own baseline by recording the best price it
// sees for each destination+cabin on every scan, persisted in localStorage, and
// flags current fares that fall well below that learned baseline. Until enough
// history accumulates it falls back to the curated "typical" seed price — the
// best available signal when historical data is constrained. The more you open
// the app, the smarter the flags get.

import { load, save } from './storage'
import type { Cabin } from '../types'

interface Observation {
  t: number // epoch ms
  price: number
}

type History = Record<string, Observation[]>

const KEY = 'farescout:priceHistory:v1'
const MAX_OBS = 90
const MIN_LEARN = 5 // observations before we trust the learned baseline

function routeKey(destinationId: string, cabin: Cabin): string {
  return `${destinationId}:${cabin}`
}

let cache: History | null = null
function db(): History {
  if (!cache) cache = load<History>(KEY, {})
  return cache
}

// Record the best price seen for a route this scan (one per calendar day so a
// page refresh doesn't flood the history).
export function recordPrice(destinationId: string, cabin: Cabin, price: number): void {
  const h = db()
  const k = routeKey(destinationId, cabin)
  const list = h[k] ?? []
  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)
  const last = list[list.length - 1]
  if (last && last.t >= dayStart.getTime()) {
    // Already recorded today — keep the lower of the two.
    last.price = Math.min(last.price, price)
  } else {
    list.push({ t: Date.now(), price })
  }
  h[k] = list.slice(-MAX_OBS)
  save(KEY, h)
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export interface BaselineInfo {
  baseline: number
  samples: number
  learned: boolean // true once we trust history over the seed
}

// Baseline for a route: median of learned history once we have enough samples,
// otherwise the curated seed (optionally nudged by any early observations).
export function getBaseline(destinationId: string, cabin: Cabin, seed: number): BaselineInfo {
  const list = db()[routeKey(destinationId, cabin)] ?? []
  if (list.length >= MIN_LEARN) {
    return { baseline: Math.round(median(list.map((o) => o.price))), samples: list.length, learned: true }
  }
  if (list.length > 0) {
    const blended = (seed + median(list.map((o) => o.price))) / 2
    return { baseline: Math.round(blended), samples: list.length, learned: false }
  }
  return { baseline: seed, samples: 0, learned: false }
}

export type DealTier = 'none' | 'good' | 'great'

export interface DealAssessment {
  baseline: number
  pctBelow: number // positive = cheaper than baseline
  tier: DealTier
  learned: boolean
  samples: number
}

export function assessDeal(
  destinationId: string,
  cabin: Cabin,
  currentPrice: number,
  seed: number,
): DealAssessment {
  const b = getBaseline(destinationId, cabin, seed)
  const pctBelow = ((b.baseline - currentPrice) / b.baseline) * 100
  let tier: DealTier = 'none'
  if (pctBelow >= 40) tier = 'great'
  else if (pctBelow >= 22) tier = 'good'
  return { baseline: b.baseline, pctBelow, tier, learned: b.learned, samples: b.samples }
}

// Premium-cabin fares get a tighter, separate threshold — an abnormally low
// business fare (mistake fare / sale / award sweet spot) is a different signal.
export function assessPremiumDeal(
  destinationId: string,
  currentBizPrice: number,
  seed: number,
): DealAssessment {
  const b = getBaseline(destinationId, 'business', seed)
  const pctBelow = ((b.baseline - currentBizPrice) / b.baseline) * 100
  let tier: DealTier = 'none'
  if (pctBelow >= 45) tier = 'great'
  else if (pctBelow >= 30) tier = 'good'
  return { baseline: b.baseline, pctBelow, tier, learned: b.learned, samples: b.samples }
}
