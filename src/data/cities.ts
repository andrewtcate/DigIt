// Bundled major-city gazetteer used to geocode the home-city input without an
// external geocoding service. Matching is case-insensitive and tolerant of
// "City, ST" / "City ST" / bare "City" forms plus a few common aliases.
// For full global coverage you would swap this lookup for a geocoding API;
// the inference math in lib/geo.ts only needs a {lat,lng}.

export interface City {
  name: string
  state: string
  lat: number
  lng: number
  aliases?: string[]
}

export const CITIES: City[] = [
  { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572, aliases: ['tampa bay', 'st petersburg', 'st. petersburg', 'clearwater'] },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lng: -80.1373 },
  { name: 'Jacksonville', state: 'FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Fort Myers', state: 'FL', lat: 26.6406, lng: -81.8723 },
  { name: 'Washington', state: 'DC', lat: 38.9072, lng: -77.0369, aliases: ['dc', 'washington dc', 'd.c.'] },
  { name: 'Baltimore', state: 'MD', lat: 39.2904, lng: -76.6122 },
  { name: 'Arlington', state: 'VA', lat: 38.8816, lng: -77.0910 },
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060, aliases: ['nyc', 'manhattan', 'brooklyn'] },
  { name: 'Newark', state: 'NJ', lat: 40.7357, lng: -74.1724 },
  { name: 'Jersey City', state: 'NJ', lat: 40.7178, lng: -74.0431 },
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lng: -75.1652, aliases: ['philly'] },
  { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lng: -79.9959 },
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  { name: 'Providence', state: 'RI', lat: 41.8240, lng: -71.4128 },
  { name: 'Hartford', state: 'CT', lat: 41.7658, lng: -72.6734 },
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Milwaukee', state: 'WI', lat: 43.0389, lng: -87.9065 },
  { name: 'Atlanta', state: 'GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Raleigh', state: 'NC', lat: 35.7796, lng: -78.6382, aliases: ['durham', 'raleigh durham'] },
  { name: 'Nashville', state: 'TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970, aliases: ['fort worth', 'dfw', 'dallas fort worth'] },
  { name: 'Houston', state: 'TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lng: -97.7431 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lng: -98.4936 },
  { name: 'New Orleans', state: 'LA', lat: 29.9511, lng: -90.0715, aliases: ['nola'] },
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398, aliases: ['vegas'] },
  { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lng: -111.8910, aliases: ['slc'] },
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437, aliases: ['la', 'l.a.'] },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194, aliases: ['sf', 'bay area'] },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lng: -121.8863 },
  { name: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712 },
  { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Minneapolis', state: 'MN', lat: 44.9778, lng: -93.2650, aliases: ['st paul', 'twin cities'] },
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Cleveland', state: 'OH', lat: 41.4993, lng: -81.6944 },
  { name: 'Columbus', state: 'OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Cincinnati', state: 'OH', lat: 39.1031, lng: -84.5120 },
  { name: 'Indianapolis', state: 'IN', lat: 39.7684, lng: -86.1581, aliases: ['indy'] },
  { name: 'St. Louis', state: 'MO', lat: 38.6270, lng: -90.1994, aliases: ['st louis', 'saint louis'] },
  { name: 'Kansas City', state: 'MO', lat: 39.0997, lng: -94.5786 },
  { name: 'Honolulu', state: 'HI', lat: 21.3069, lng: -157.8583 },
]

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface GeocodeResult {
  label: string
  lat: number
  lng: number
}

// Resolve a free-text home-city string to coordinates. Returns null if no
// confident match — the caller can then ask the user to pick from CITIES.
export function geocodeCity(input: string): GeocodeResult | null {
  const q = norm(input)
  if (!q) return null

  // Drop a trailing 2-letter state code so "Tampa, FL" -> "tampa".
  const tokens = q.split(' ')
  let stateHint = ''
  if (tokens.length > 1 && tokens[tokens.length - 1].length === 2) {
    stateHint = tokens[tokens.length - 1].toUpperCase()
  }
  const bare = stateHint ? tokens.slice(0, -1).join(' ') : q

  for (const c of CITIES) {
    const cityName = norm(c.name)
    const names = [cityName, ...(c.aliases ?? []).map(norm)]
    const matchesName = names.some((n) => n === bare || n === q)
    const matchesState = !stateHint || stateHint === c.state
    if (matchesName && matchesState) {
      return { label: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng }
    }
  }

  // Loose contains-match as a fallback (e.g. "downtown tampa").
  for (const c of CITIES) {
    const names = [norm(c.name), ...(c.aliases ?? []).map(norm)]
    if (names.some((n) => bare.includes(n) || q.includes(n))) {
      return { label: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng }
    }
  }

  return null
}
