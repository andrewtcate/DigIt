// Deterministic offline flight-data engine. This is what powers FareScout out
// of the box with zero API keys: it produces realistic, *stable-per-day* fares
// so the ranked homepage, the "unusually cheap" flags and the points optimizer
// all work immediately. Swap in the Amadeus adapter (lib/amadeus.ts) for live
// data by providing keys — see lib/provider.ts.

import { DESTINATIONS } from '../data/destinations'
import type { Destination } from '../data/destinations'
import { airport } from '../data/airports'
import type { AwardOption, Cabin, RouteFare } from '../types'

// ── tiny seeded RNG so results are reproducible for a given (route, day) ──
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Relative cost multiplier per US gateway — big international hubs price long-haul
// cheaper than small regional fields. Defaults to a mild premium otherwise.
const ORIGIN_FACTOR: Record<string, number> = {
  JFK: 0.92, EWR: 0.93, BOS: 0.95, IAD: 0.96, ORD: 0.95, MIA: 0.96, ATL: 0.97,
  LAX: 0.97, SFO: 0.98, SEA: 0.99, DFW: 0.99, IAH: 0.99, DEN: 1.0, MCO: 1.0,
  PHL: 0.97, DTW: 0.99, MSP: 1.0, CLT: 1.0, TPA: 1.04, PIE: 1.08, FLL: 1.0,
}
function originFactor(iata: string): number {
  return ORIGIN_FACTOR[iata] ?? 1.06
}

// Asia is reached more cheaply from the West Coast, Europe from the East Coast.
function geoFactor(origin: string, dest: Destination): number {
  const a = airport(origin)
  if (!a) return 1
  const west = a.lng < -100
  if (dest.region === 'Asia') return west ? 0.9 : 1.08
  return west ? 1.08 : 0.94 // Europe
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Pick a representative round trip within the search window, stable per dest.
function tripDates(dest: Destination, today: Date, monthsAhead: number): { out: string; back: string } {
  const rnd = mulberry32(hashStr(dest.id + 'dates'))
  const horizonDays = Math.max(21, monthsAhead * 30)
  const daysOut = 21 + Math.floor(rnd() * (horizonDays - 28))
  const nights = dest.region === 'Asia' ? 9 + Math.floor(rnd() * 5) : 6 + Math.floor(rnd() * 5)
  const out = new Date(today)
  out.setDate(out.getDate() + daysOut)
  const back = new Date(out)
  back.setDate(back.getDate() + nights)
  return { out: isoDate(out), back: isoDate(back) }
}

const CARRIERS = ['Delta', 'United', 'American', 'TAP', 'Iberia', 'Air France', 'KLM', 'ANA', 'JAL', 'Singapore', 'Cathay', 'Turkish', 'Aer Lingus']

function carrierFor(dest: Destination, origin: string): string {
  const rnd = mulberry32(hashStr(dest.id + origin + 'carrier'))
  return CARRIERS[Math.floor(rnd() * CARRIERS.length)]
}

// Day key so the whole scan is stable within a calendar day but evolves daily,
// which lets the baseline-learning module accumulate a real history over time.
function dayKey(today: Date): string {
  return isoDate(today)
}

function awardOptions(dest: Destination, cabin: Cabin): AwardOption[] {
  return dest.awards.map((a) => {
    const isBiz = cabin === 'business'
    return {
      program: a.program,
      miles: isBiz ? a.bizMiles : a.econMiles,
      taxes: isBiz ? a.bizTaxes : a.econTaxes,
      cabin: isBiz ? 'business' : 'economy',
      note: a.note,
    }
  })
}

export interface ScanParams {
  origins: string[]
  monthsAhead: number
  today?: Date
}

// Generate fares for every (origin × destination) for both economy and business.
// The orchestrator decides which cabin to show and which origin is cheapest.
export function scanFares({ origins, monthsAhead, today = new Date() }: ScanParams): RouteFare[] {
  const dk = dayKey(today)
  const fares: RouteFare[] = []

  for (const dest of DESTINATIONS) {
    const { out, back } = tripDates(dest, today, monthsAhead)

    // Is today a "deal day" for this destination? Deterministic per dest+day.
    const dealRnd = mulberry32(hashStr(dest.id + dk + 'deal'))
    const econDealFactor = dealRnd() < 0.22 ? 0.55 + dealRnd() * 0.2 : 0.9 + dealRnd() * 0.28
    const bizMistake = dealRnd() < 0.14 // abnormally low premium fare today
    const bizDealFactor = bizMistake ? 0.38 + dealRnd() * 0.14 : 0.85 + dealRnd() * 0.35

    for (const origin of origins) {
      const base = originFactor(origin) * geoFactor(origin, dest)
      const jitter = mulberry32(hashStr(dest.id + origin + dk))
      const noise = 0.94 + jitter() * 0.12

      const econPrice = Math.round((dest.typicalEconUSD * base * econDealFactor * noise) / 5) * 5
      const bizPrice = Math.round((dest.typicalBizUSD * base * bizDealFactor * noise) / 10) * 10
      const stops = origin === dest.iata ? 0 : jitter() < 0.45 ? 0 : 1

      fares.push({
        destinationId: dest.id,
        originIata: origin,
        destinationIata: dest.iata,
        dateOut: out,
        dateBack: back,
        cabin: 'economy',
        cashPriceUSD: econPrice,
        airline: carrierFor(dest, origin),
        stops,
        awards: awardOptions(dest, 'economy'),
      })
      fares.push({
        destinationId: dest.id,
        originIata: origin,
        destinationIata: dest.iata,
        dateOut: out,
        dateBack: back,
        cabin: 'business',
        cashPriceUSD: bizPrice,
        airline: carrierFor(dest, origin),
        stops,
        awards: awardOptions(dest, 'business'),
      })
    }
  }

  return fares
}
