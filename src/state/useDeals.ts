import { useEffect, useMemo, useState } from 'react'
import { DESTINATIONS } from '../data/destinations'
import type { Destination } from '../data/destinations'
import { getFares, type ProviderSource } from '../lib/provider'
import type { Cabin, DepartureAirport, Mode, RouteFare, Settings } from '../types'
import { assessDeal, assessPremiumDeal, recordPrice, type DealAssessment } from '../lib/baseline'
import { optimize, type DealEconomics } from '../lib/points'

export interface Deal {
  destination: Destination
  // Economy (the default homepage metric)
  econOrigin: DepartureAirport
  econPrice: number
  dateOut: string
  dateBack: string
  econAssessment: DealAssessment
  econEconomics: DealEconomics
  // Business / premium (separately flagged)
  bizOrigin: DepartureAirport
  bizPrice: number
  bizAssessment: DealAssessment
  bizEconomics: DealEconomics
  premiumDeal: boolean
}

function cheapest(fares: RouteFare[]): RouteFare | null {
  if (!fares.length) return null
  return fares.reduce((min, f) => (f.cashPriceUSD < min.cashPriceUSD ? f : min))
}

function buildDeals(
  fares: RouteFare[],
  settings: Settings,
): Deal[] {
  const originByIata = new Map(settings.departureAirports.map((a) => [a.iata, a]))
  const deals: Deal[] = []

  for (const dest of DESTINATIONS) {
    const econFares = fares.filter((f) => f.destinationId === dest.id && f.cabin === 'economy')
    const bizFares = fares.filter((f) => f.destinationId === dest.id && f.cabin === 'business')
    const econ = cheapest(econFares)
    const biz = cheapest(bizFares)
    if (!econ || !biz) continue

    const econOrigin = originByIata.get(econ.originIata)
    const bizOrigin = originByIata.get(biz.originIata)
    if (!econOrigin || !bizOrigin) continue

    // Record the best price each scan so the baseline learns over time.
    recordPrice(dest.id, 'economy', econ.cashPriceUSD)
    recordPrice(dest.id, 'business', biz.cashPriceUSD)

    const econAssessment = assessDeal(dest.id, 'economy', econ.cashPriceUSD, dest.typicalEconUSD)
    const bizAssessment = assessPremiumDeal(dest.id, biz.cashPriceUSD, dest.typicalBizUSD)

    deals.push({
      destination: dest,
      econOrigin,
      econPrice: econ.cashPriceUSD,
      dateOut: econ.dateOut,
      dateBack: econ.dateBack,
      econAssessment,
      econEconomics: optimize(econ.cashPriceUSD, econ.awards, settings.balances),
      bizOrigin,
      bizPrice: biz.cashPriceUSD,
      bizAssessment,
      bizEconomics: optimize(biz.cashPriceUSD, biz.awards, settings.balances),
      premiumDeal: bizAssessment.tier !== 'none',
    })
  }

  return deals
}

// Which cabin's numbers drive the headline price/ranking.
function mainCabin(cabin: Cabin): 'economy' | 'business' {
  return cabin === 'business' ? 'business' : 'economy'
}

export function rankDeals(deals: Deal[], settings: Settings, mode: Mode): Deal[] {
  const cabin = mainCabin(settings.cabin)
  const outOfPocket = (d: Deal): number => {
    const econ = cabin === 'business' ? d.bizEconomics : d.econEconomics
    if (mode === 'haveNow') return econ.readyNow.cashOutOfPocket
    // Aspirational: the cash you'd pay on the best possible redemption (taxes),
    // falling back to ready-now cash if no award exists.
    return econ.bestAward ? econ.bestAward.cashOutOfPocket : econ.readyNow.cashOutOfPocket
  }

  let list = [...deals]

  // Budget filter applies to what you'd actually pay in the active mode.
  if (settings.cashBudgetUSD != null) {
    const budget = settings.cashBudgetUSD
    list = list.filter((d) => outOfPocket(d) <= budget)
  }

  // Rank cheapest-first; nudge flagged deals slightly higher within ties.
  return list.sort((a, b) => {
    const diff = outOfPocket(a) - outOfPocket(b)
    if (Math.abs(diff) > 1) return diff
    const score = (d: Deal) =>
      (cabin === 'business' ? d.bizAssessment : d.econAssessment).tier === 'great' ? 2 : 0
    return score(b) - score(a)
  })
}

export interface DealsState {
  deals: Deal[]
  loading: boolean
  source: ProviderSource
  note?: string
  refresh: () => void
}

export function useDeals(settings: Settings): DealsState {
  const [fares, setFares] = useState<RouteFare[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<ProviderSource>('offline')
  const [note, setNote] = useState<string | undefined>()
  const [nonce, setNonce] = useState(0)

  const origins = useMemo(
    () => settings.departureAirports.map((a) => a.iata),
    [settings.departureAirports],
  )
  const originsKey = origins.join(',')

  useEffect(() => {
    let alive = true
    // Intentional: show the spinner the moment a new scan starts (deps changed).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getFares({ origins, monthsAhead: settings.monthsAhead })
      .then((res) => {
        if (!alive) return
        setFares(res.fares)
        setSource(res.source)
        setNote(res.note)
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originsKey, settings.monthsAhead, nonce])

  const deals = useMemo(
    () => buildDeals(fares, settings),
    // balances/cabin affect economics; recompute when they change too
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fares, settings.balances, settings.departureAirports],
  )

  return { deals, loading, source, note, refresh: () => setNonce((n) => n + 1) }
}
