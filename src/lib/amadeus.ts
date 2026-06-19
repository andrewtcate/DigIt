// Amadeus Self-Service adapter (live flight data).
//
// CHOSEN API: Amadeus Self-Service. Of Amadeus / Kiwi-Tequila / Skyscanner /
// Duffel it is the best fit for a ranked, multi-destination cheap-fare homepage:
//   • Flight Inspiration Search  — cheapest destinations from an origin (ranking)
//   • Flight Offers Search       — priced itineraries for a chosen route/date
//   • Flight Cheapest Date Search— cheapest dates for date-flexible search
// It also has a real free self-service tier and simple OAuth2 (id + secret).
//
// KEYS REQUIRED (set in a .env file, see .env.example):
//   VITE_AMADEUS_CLIENT_ID
//   VITE_AMADEUS_CLIENT_SECRET
//   VITE_AMADEUS_ENV=test|production   (default: test)
//
// ⚠️ BROWSER CORS: Amadeus does not send CORS headers, so the token + search
// calls cannot be made directly from the browser in production. Run a thin
// proxy (or serverless function) that injects the credentials and forwards to
// Amadeus, then point VITE_AMADEUS_PROXY at it. Without keys/proxy the app uses
// the deterministic offline engine (lib/mockEngine.ts) — fully functional.

import { DESTINATIONS } from '../data/destinations'
import type { AwardOption, RouteFare } from '../types'
import type { ScanParams } from './mockEngine'

const ID = import.meta.env.VITE_AMADEUS_CLIENT_ID as string | undefined
const SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET as string | undefined
const PROXY = import.meta.env.VITE_AMADEUS_PROXY as string | undefined
const ENV = (import.meta.env.VITE_AMADEUS_ENV as string | undefined) ?? 'test'

const BASE = PROXY
  ? PROXY.replace(/\/$/, '')
  : ENV === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com'

export function amadeusConfigured(): boolean {
  return Boolean((ID && SECRET) || PROXY)
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function token(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) return cachedToken.value
  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: ID ?? '',
      client_secret: SECRET ?? '',
    }),
  })
  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
  const json = await res.json()
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return cachedToken.value
}

interface OfferQuery {
  origin: string
  destination: string
  departureDate: string
  returnDate: string
  cabin: 'ECONOMY' | 'BUSINESS'
}

async function cheapestOffer(q: OfferQuery, jwt: string): Promise<number | null> {
  const params = new URLSearchParams({
    originLocationCode: q.origin,
    destinationLocationCode: q.destination,
    departureDate: q.departureDate,
    returnDate: q.returnDate,
    adults: '1',
    travelClass: q.cabin,
    currencyCode: 'USD',
    max: '1',
  })
  const res = await fetch(`${BASE}/v2/shopping/flight-offers?${params}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  const offer = json?.data?.[0]
  if (!offer) return null
  return Number(offer.price?.grandTotal ?? offer.price?.total)
}

function awardOptions(destId: string, cabin: 'economy' | 'business'): AwardOption[] {
  const dest = DESTINATIONS.find((d) => d.id === destId)
  if (!dest) return []
  return dest.awards.map((a) => ({
    program: a.program,
    miles: cabin === 'business' ? a.bizMiles : a.econMiles,
    taxes: cabin === 'business' ? a.bizTaxes : a.econTaxes,
    cabin,
    note: a.note,
  }))
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Scan live fares for every (origin × destination). Award data is not exposed by
// Amadeus, so award sweet-spots come from the curated config (same as offline).
export async function scanFaresLive({ origins, monthsAhead, today = new Date() }: ScanParams): Promise<RouteFare[]> {
  const jwt = await token()
  const fares: RouteFare[] = []

  for (const dest of DESTINATIONS) {
    const out = new Date(today)
    out.setDate(out.getDate() + Math.min(45, monthsAhead * 20))
    const back = new Date(out)
    back.setDate(back.getDate() + (dest.region === 'Asia' ? 11 : 8))
    const departureDate = iso(out)
    const returnDate = iso(back)

    for (const origin of origins) {
      const [econ, biz] = await Promise.all([
        cheapestOffer({ origin, destination: dest.iata, departureDate, returnDate, cabin: 'ECONOMY' }, jwt),
        cheapestOffer({ origin, destination: dest.iata, departureDate, returnDate, cabin: 'BUSINESS' }, jwt),
      ])
      if (econ != null) {
        fares.push({
          destinationId: dest.id, originIata: origin, destinationIata: dest.iata,
          dateOut: departureDate, dateBack: returnDate, cabin: 'economy',
          cashPriceUSD: Math.round(econ), airline: '', stops: 0,
          awards: awardOptions(dest.id, 'economy'),
        })
      }
      if (biz != null) {
        fares.push({
          destinationId: dest.id, originIata: origin, destinationIata: dest.iata,
          dateOut: departureDate, dateBack: returnDate, cabin: 'business',
          cashPriceUSD: Math.round(biz), airline: '', stops: 0,
          awards: awardOptions(dest.id, 'business'),
        })
      }
    }
  }

  return fares
}
