import { US_AIRPORTS } from '../data/airports'
import type { DepartureAirport } from '../types'

const EARTH_RADIUS_MI = 3958.8

// Great-circle distance between two coordinates, in statute miles.
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a))
}

// Convert straight-line distance to a rough driving time. Roads are not
// straight, so apply a circuity factor, assume an average door-to-gate speed,
// and add fixed overhead for parking/getting to the terminal.
const ROAD_CIRCUITY = 1.25
const AVG_SPEED_MPH = 60
const FIXED_OVERHEAD_MIN = 15

export function estimateDriveMinutes(distanceMi: number): number {
  const roadMiles = distanceMi * ROAD_CIRCUITY
  return Math.round((roadMiles / AVG_SPEED_MPH) * 60 + FIXED_OVERHEAD_MIN)
}

export function formatDrive(minutes: number): string {
  if (minutes < 60) return `${minutes} min drive`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} hr drive` : `${h} hr ${m} min drive`
}

export interface InferOptions {
  maxDriveMinutes?: number // default ~2.5 hours
  maxAirports?: number
}

// Infer a ranked set of reasonable departure airports for a home location.
// Always includes the single nearest airport (even if beyond the radius, so the
// app never returns zero options), marks it as the home airport, and adds every
// other airport within the drive radius, nearest first.
export function inferDepartureAirports(
  lat: number,
  lng: number,
  opts: InferOptions = {},
): DepartureAirport[] {
  const maxDrive = opts.maxDriveMinutes ?? 150
  const maxAirports = opts.maxAirports ?? 6

  const ranked = US_AIRPORTS.map((a) => {
    const distanceMi = Math.round(haversineMiles(lat, lng, a.lat, a.lng))
    const driveMinutes = estimateDriveMinutes(distanceMi)
    return { airport: a, distanceMi, driveMinutes }
  }).sort((x, y) => x.distanceMi - y.distanceMi)

  const homeIata = ranked[0].airport.iata
  const withinRadius = ranked.filter(
    (r) => r.driveMinutes <= maxDrive || r.airport.iata === homeIata,
  )

  return withinRadius.slice(0, maxAirports).map((r) => ({
    iata: r.airport.iata,
    name: r.airport.name,
    city: r.airport.city,
    distanceMi: r.distanceMi,
    driveMinutes: r.driveMinutes,
    isHome: r.airport.iata === homeIata,
  }))
}
