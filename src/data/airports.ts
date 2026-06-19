// Airport database with coordinates, used for geographic departure-airport
// inference (US origins) and as international destination gateways.
// `intl` marks airports with meaningful international long-haul service.
// `hub` marks major connecting hubs.

export interface Airport {
  iata: string
  name: string
  city: string
  country: string
  lat: number
  lng: number
  intl: boolean
  hub: boolean
}

// US + Canada airports — the pool we infer departure options from.
export const US_AIRPORTS: Airport[] = [
  { iata: 'TPA', name: 'Tampa Intl', city: 'Tampa', country: 'US', lat: 27.9755, lng: -82.5332, intl: true, hub: false },
  { iata: 'PIE', name: 'St. Pete–Clearwater Intl', city: 'Clearwater', country: 'US', lat: 27.9102, lng: -82.6874, intl: false, hub: false },
  { iata: 'MCO', name: 'Orlando Intl', city: 'Orlando', country: 'US', lat: 28.4312, lng: -81.3081, intl: true, hub: false },
  { iata: 'MIA', name: 'Miami Intl', city: 'Miami', country: 'US', lat: 25.7959, lng: -80.2870, intl: true, hub: true },
  { iata: 'FLL', name: 'Fort Lauderdale–Hollywood Intl', city: 'Fort Lauderdale', country: 'US', lat: 26.0742, lng: -80.1506, intl: true, hub: false },
  { iata: 'JAX', name: 'Jacksonville Intl', city: 'Jacksonville', country: 'US', lat: 30.4941, lng: -81.6879, intl: false, hub: false },
  { iata: 'RSW', name: 'Southwest Florida Intl', city: 'Fort Myers', country: 'US', lat: 26.5362, lng: -81.7552, intl: false, hub: false },
  { iata: 'DCA', name: 'Reagan National', city: 'Washington', country: 'US', lat: 38.8512, lng: -77.0402, intl: false, hub: false },
  { iata: 'IAD', name: 'Washington Dulles Intl', city: 'Washington', country: 'US', lat: 38.9531, lng: -77.4565, intl: true, hub: true },
  { iata: 'BWI', name: 'Baltimore/Washington Intl', city: 'Baltimore', country: 'US', lat: 39.1754, lng: -76.6683, intl: true, hub: false },
  { iata: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781, intl: true, hub: true },
  { iata: 'EWR', name: 'Newark Liberty Intl', city: 'Newark', country: 'US', lat: 40.6895, lng: -74.1745, intl: true, hub: true },
  { iata: 'LGA', name: 'LaGuardia', city: 'New York', country: 'US', lat: 40.7769, lng: -73.8740, intl: false, hub: false },
  { iata: 'PHL', name: 'Philadelphia Intl', city: 'Philadelphia', country: 'US', lat: 39.8729, lng: -75.2437, intl: true, hub: true },
  { iata: 'BOS', name: 'Boston Logan Intl', city: 'Boston', country: 'US', lat: 42.3656, lng: -71.0096, intl: true, hub: true },
  { iata: 'ORD', name: "Chicago O'Hare Intl", city: 'Chicago', country: 'US', lat: 41.9742, lng: -87.9073, intl: true, hub: true },
  { iata: 'MDW', name: 'Chicago Midway Intl', city: 'Chicago', country: 'US', lat: 41.7868, lng: -87.7522, intl: false, hub: false },
  { iata: 'ATL', name: 'Hartsfield–Jackson Atlanta Intl', city: 'Atlanta', country: 'US', lat: 33.6407, lng: -84.4277, intl: true, hub: true },
  { iata: 'DFW', name: 'Dallas/Fort Worth Intl', city: 'Dallas', country: 'US', lat: 32.8998, lng: -97.0403, intl: true, hub: true },
  { iata: 'DAL', name: 'Dallas Love Field', city: 'Dallas', country: 'US', lat: 32.8471, lng: -96.8518, intl: false, hub: false },
  { iata: 'IAH', name: 'Houston George Bush Intercontinental', city: 'Houston', country: 'US', lat: 29.9902, lng: -95.3368, intl: true, hub: true },
  { iata: 'HOU', name: 'Houston Hobby', city: 'Houston', country: 'US', lat: 29.6454, lng: -95.2789, intl: false, hub: false },
  { iata: 'DEN', name: 'Denver Intl', city: 'Denver', country: 'US', lat: 39.8561, lng: -104.6737, intl: true, hub: true },
  { iata: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9416, lng: -118.4085, intl: true, hub: true },
  { iata: 'SNA', name: 'John Wayne (Orange County)', city: 'Santa Ana', country: 'US', lat: 33.6757, lng: -117.8682, intl: false, hub: false },
  { iata: 'BUR', name: 'Hollywood Burbank', city: 'Burbank', country: 'US', lat: 34.2007, lng: -118.3590, intl: false, hub: false },
  { iata: 'ONT', name: 'Ontario Intl', city: 'Ontario', country: 'US', lat: 34.0560, lng: -117.6012, intl: false, hub: false },
  { iata: 'SAN', name: 'San Diego Intl', city: 'San Diego', country: 'US', lat: 32.7338, lng: -117.1933, intl: true, hub: false },
  { iata: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', lat: 37.6213, lng: -122.3790, intl: true, hub: true },
  { iata: 'OAK', name: 'Oakland Intl', city: 'Oakland', country: 'US', lat: 37.7126, lng: -122.2197, intl: false, hub: false },
  { iata: 'SJC', name: 'San Jose Intl', city: 'San Jose', country: 'US', lat: 37.3639, lng: -121.9289, intl: false, hub: false },
  { iata: 'SEA', name: 'Seattle–Tacoma Intl', city: 'Seattle', country: 'US', lat: 47.4502, lng: -122.3088, intl: true, hub: true },
  { iata: 'PDX', name: 'Portland Intl', city: 'Portland', country: 'US', lat: 45.5898, lng: -122.5951, intl: true, hub: false },
  { iata: 'LAS', name: 'Harry Reid Intl', city: 'Las Vegas', country: 'US', lat: 36.0840, lng: -115.1537, intl: true, hub: false },
  { iata: 'PHX', name: 'Phoenix Sky Harbor Intl', city: 'Phoenix', country: 'US', lat: 33.4373, lng: -112.0078, intl: true, hub: true },
  { iata: 'SLC', name: 'Salt Lake City Intl', city: 'Salt Lake City', country: 'US', lat: 40.7899, lng: -111.9791, intl: true, hub: true },
  { iata: 'MSP', name: 'Minneapolis–St. Paul Intl', city: 'Minneapolis', country: 'US', lat: 44.8848, lng: -93.2223, intl: true, hub: true },
  { iata: 'DTW', name: 'Detroit Metro', city: 'Detroit', country: 'US', lat: 42.2162, lng: -83.3554, intl: true, hub: true },
  { iata: 'CLT', name: 'Charlotte Douglas Intl', city: 'Charlotte', country: 'US', lat: 35.2140, lng: -80.9431, intl: true, hub: true },
  { iata: 'RDU', name: 'Raleigh–Durham Intl', city: 'Raleigh', country: 'US', lat: 35.8801, lng: -78.7880, intl: false, hub: false },
  { iata: 'BNA', name: 'Nashville Intl', city: 'Nashville', country: 'US', lat: 36.1263, lng: -86.6774, intl: false, hub: false },
  { iata: 'AUS', name: 'Austin–Bergstrom Intl', city: 'Austin', country: 'US', lat: 30.1975, lng: -97.6664, intl: false, hub: false },
  { iata: 'SAT', name: 'San Antonio Intl', city: 'San Antonio', country: 'US', lat: 29.5337, lng: -98.4698, intl: false, hub: false },
  { iata: 'MSY', name: 'New Orleans Intl', city: 'New Orleans', country: 'US', lat: 29.9934, lng: -90.2580, intl: false, hub: false },
  { iata: 'STL', name: 'St. Louis Lambert Intl', city: 'St. Louis', country: 'US', lat: 38.7487, lng: -90.3700, intl: false, hub: false },
  { iata: 'MCI', name: 'Kansas City Intl', city: 'Kansas City', country: 'US', lat: 39.2976, lng: -94.7139, intl: false, hub: false },
  { iata: 'CLE', name: 'Cleveland Hopkins Intl', city: 'Cleveland', country: 'US', lat: 41.4117, lng: -81.8498, intl: false, hub: false },
  { iata: 'CMH', name: 'John Glenn Columbus Intl', city: 'Columbus', country: 'US', lat: 39.9980, lng: -82.8919, intl: false, hub: false },
  { iata: 'PIT', name: 'Pittsburgh Intl', city: 'Pittsburgh', country: 'US', lat: 40.4915, lng: -80.2329, intl: false, hub: false },
  { iata: 'IND', name: 'Indianapolis Intl', city: 'Indianapolis', country: 'US', lat: 39.7173, lng: -86.2944, intl: false, hub: false },
  { iata: 'MKE', name: 'Milwaukee Mitchell Intl', city: 'Milwaukee', country: 'US', lat: 42.9472, lng: -87.8966, intl: false, hub: false },
  { iata: 'SMF', name: 'Sacramento Intl', city: 'Sacramento', country: 'US', lat: 38.6954, lng: -121.5908, intl: false, hub: false },
  { iata: 'HNL', name: 'Daniel K. Inouye Intl', city: 'Honolulu', country: 'US', lat: 21.3187, lng: -157.9224, intl: true, hub: false },
]

// International destination gateways (Europe + Asia focus).
export const INTL_AIRPORTS: Airport[] = [
  { iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB', lat: 51.4700, lng: -0.4543, intl: true, hub: true },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479, intl: true, hub: true },
  { iata: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'ES', lat: 41.2974, lng: 2.0833, intl: true, hub: false },
  { iata: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'ES', lat: 40.4983, lng: -3.5676, intl: true, hub: true },
  { iata: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'IT', lat: 41.8003, lng: 12.2389, intl: true, hub: true },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lng: 4.7683, intl: true, hub: true },
  { iata: 'LIS', name: 'Lisbon Portela', city: 'Lisbon', country: 'PT', lat: 38.7742, lng: -9.1342, intl: true, hub: false },
  { iata: 'ATH', name: 'Athens Intl', city: 'Athens', country: 'GR', lat: 37.9364, lng: 23.9445, intl: true, hub: false },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'TR', lat: 41.2753, lng: 28.7519, intl: true, hub: true },
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'IE', lat: 53.4213, lng: -6.2701, intl: true, hub: false },
  { iata: 'CPH', name: 'Copenhagen Kastrup', city: 'Copenhagen', country: 'DK', lat: 55.6180, lng: 12.6508, intl: true, hub: false },
  { iata: 'KEF', name: 'Reykjavik Keflavik', city: 'Reykjavik', country: 'IS', lat: 63.9850, lng: -22.6056, intl: true, hub: false },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'CH', lat: 47.4647, lng: 8.5492, intl: true, hub: false },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'DE', lat: 48.3538, lng: 11.7861, intl: true, hub: true },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622, intl: true, hub: true },
  { iata: 'PRG', name: 'Prague Vaclav Havel', city: 'Prague', country: 'CZ', lat: 50.1008, lng: 14.2600, intl: true, hub: false },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798, intl: true, hub: true },
  { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'JP', lat: 35.7720, lng: 140.3929, intl: true, hub: true },
  { iata: 'ICN', name: 'Seoul Incheon', city: 'Seoul', country: 'KR', lat: 37.4602, lng: 126.4407, intl: true, hub: true },
  { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915, intl: true, hub: true },
  { iata: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'TH', lat: 13.6900, lng: 100.7501, intl: true, hub: true },
  { iata: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK', lat: 22.3080, lng: 113.9185, intl: true, hub: true },
  { iata: 'TPE', name: 'Taipei Taoyuan', city: 'Taipei', country: 'TW', lat: 25.0777, lng: 121.2328, intl: true, hub: false },
  { iata: 'DPS', name: 'Bali Ngurah Rai', city: 'Bali', country: 'ID', lat: -8.7482, lng: 115.1672, intl: true, hub: false },
  { iata: 'DEL', name: 'Delhi Indira Gandhi Intl', city: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000, intl: true, hub: true },
  { iata: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.2532, lng: 55.3657, intl: true, hub: true },
  { iata: 'KUL', name: 'Kuala Lumpur Intl', city: 'Kuala Lumpur', country: 'MY', lat: 2.7456, lng: 101.7099, intl: true, hub: true },
  { iata: 'SGN', name: 'Ho Chi Minh City', city: 'Ho Chi Minh City', country: 'VN', lat: 10.8188, lng: 106.6520, intl: true, hub: false },
  { iata: 'MEX', name: 'Mexico City Intl', city: 'Mexico City', country: 'MX', lat: 19.4361, lng: -99.0719, intl: true, hub: false },
]

export const ALL_AIRPORTS: Airport[] = [...US_AIRPORTS, ...INTL_AIRPORTS]

const BY_IATA = new Map(ALL_AIRPORTS.map((a) => [a.iata, a]))
export function airport(iata: string): Airport | undefined {
  return BY_IATA.get(iata)
}
