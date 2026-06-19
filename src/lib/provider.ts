// Flight-data provider abstraction. Uses the live Amadeus adapter when keys (or
// a proxy) are configured, otherwise falls back to the deterministic offline
// engine so the app is always usable. If a live call fails for any reason we
// degrade gracefully to the offline engine rather than showing an empty page.

import type { RouteFare } from '../types'
import { scanFares, type ScanParams } from './mockEngine'
import { amadeusConfigured, scanFaresLive } from './amadeus'

export type ProviderSource = 'amadeus' | 'offline'

export interface ScanResult {
  fares: RouteFare[]
  source: ProviderSource
  note?: string
}

export async function getFares(params: ScanParams): Promise<ScanResult> {
  if (amadeusConfigured()) {
    try {
      const fares = await scanFaresLive(params)
      if (fares.length > 0) return { fares, source: 'amadeus' }
      return { fares: scanFares(params), source: 'offline', note: 'Amadeus returned no fares; showing offline estimates.' }
    } catch (err) {
      return {
        fares: scanFares(params),
        source: 'offline',
        note: `Live fetch failed (${(err as Error).message}); showing offline estimates.`,
      }
    }
  }
  return { fares: scanFares(params), source: 'offline' }
}
