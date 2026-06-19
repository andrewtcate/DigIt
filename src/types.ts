// Shared domain types for FareScout.

export type Cabin = 'economy' | 'premium' | 'business' | 'any'

export interface DepartureAirport {
  iata: string
  name: string
  city: string
  distanceMi: number
  driveMinutes: number
  isHome: boolean // nearest airport to the home city
}

// Award availability for a route, keyed by airline program id.
export interface AwardOption {
  program: string // airline program id (transferPartners AIRLINE_PROGRAMS)
  miles: number
  taxes: number // cash due at booking, USD
  cabin: Cabin
  note: string
}

// One priced itinerary returned by the flight provider (or mock engine).
export interface RouteFare {
  destinationId: string
  originIata: string
  destinationIata: string
  dateOut: string // ISO date
  dateBack: string // ISO date
  cabin: Cabin
  cashPriceUSD: number
  airline: string
  stops: number
  awards: AwardOption[]
}

export type Mode = 'haveNow' | 'aspirational'

export interface RewardsBalances {
  // keyed by program id (bank or airline); value in points/miles
  [programId: string]: number
}

export interface Settings {
  homeLabel: string
  homeLat: number
  homeLng: number
  departureAirports: DepartureAirport[]
  maxDriveMinutes: number
  cashBudgetUSD: number | null
  balances: RewardsBalances
  cabin: Cabin
  // Date flexibility: 'flex' = anytime in next N months.
  monthsAhead: number
  configured: boolean // home city has been confirmed at least once
}
