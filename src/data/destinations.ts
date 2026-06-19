// Curated, well-reviewed international destinations the app suggests on its
// own (Europe + Asia) so the user never has to name a country. Each entry
// pairs a gateway airport with the airline award programs that historically
// price this region well ("sweet spots"), used by the points optimizer.

export interface AwardSweetSpot {
  // Airline loyalty program that offers a good award rate to this region.
  program: string // matches an airline program id in transferPartners.ts
  // Round-trip miles for a saver economy award.
  econMiles: number
  // Round-trip miles for a saver business award.
  bizMiles: number
  // Cash (taxes/fees/surcharges) due at booking, USD, economy.
  econTaxes: number
  bizTaxes: number
  note: string
}

export interface Destination {
  id: string
  city: string
  country: string
  iata: string
  region: 'Europe' | 'Asia'
  blurb: string
  tags: string[]
  // Structural "typical" round-trip economy cash price from the US East Coast,
  // used to seed the baseline before the app has learned its own history.
  typicalEconUSD: number
  typicalBizUSD: number
  awards: AwardSweetSpot[]
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'lisbon',
    city: 'Lisbon',
    country: 'Portugal',
    iata: 'LIS',
    region: 'Europe',
    blurb: 'Hilltop miradouros, pastéis de nata, and the cheapest gateway to Western Europe.',
    tags: ['food', 'coast', 'value', 'walkable'],
    typicalEconUSD: 720,
    typicalBizUSD: 2600,
    awards: [
      { program: 'avios', econMiles: 26000, bizMiles: 100000, econTaxes: 180, bizTaxes: 380, note: 'TAP/Iberia via Avios off-peak' },
      { program: 'flyingblue', econMiles: 30000, bizMiles: 106000, econTaxes: 120, bizTaxes: 320, note: 'Air France-KLM Promo Rewards drop fares often' },
    ],
  },
  {
    id: 'barcelona',
    city: 'Barcelona',
    country: 'Spain',
    iata: 'BCN',
    region: 'Europe',
    blurb: 'Gaudí, tapas, and beach-meets-city energy on the Mediterranean.',
    tags: ['architecture', 'food', 'beach', 'nightlife'],
    typicalEconUSD: 760,
    typicalBizUSD: 2800,
    awards: [
      { program: 'avios', econMiles: 26000, bizMiles: 102000, econTaxes: 160, bizTaxes: 360, note: 'Iberia Avios sweet spot from US East Coast' },
      { program: 'flyingblue', econMiles: 32000, bizMiles: 110000, econTaxes: 130, bizTaxes: 330, note: 'Air France-KLM' },
    ],
  },
  {
    id: 'paris',
    city: 'Paris',
    country: 'France',
    iata: 'CDG',
    region: 'Europe',
    blurb: 'The classic — museums, cafés, and day trips across France.',
    tags: ['culture', 'food', 'romance', 'museums'],
    typicalEconUSD: 780,
    typicalBizUSD: 3100,
    awards: [
      { program: 'flyingblue', econMiles: 30000, bizMiles: 110000, econTaxes: 250, bizTaxes: 450, note: 'Air France-KLM home hub' },
      { program: 'virginatlantic', econMiles: 28000, bizMiles: 95000, econTaxes: 200, bizTaxes: 400, note: 'Delta One via Virgin Atlantic' },
    ],
  },
  {
    id: 'rome',
    city: 'Rome',
    country: 'Italy',
    iata: 'FCO',
    region: 'Europe',
    blurb: 'Ancient ruins, espresso, and the gateway to all of Italy.',
    tags: ['history', 'food', 'art', 'walkable'],
    typicalEconUSD: 820,
    typicalBizUSD: 3000,
    awards: [
      { program: 'avios', econMiles: 30000, bizMiles: 110000, econTaxes: 170, bizTaxes: 380, note: 'ITA/Iberia via Avios' },
      { program: 'flyingblue', econMiles: 34000, bizMiles: 115000, econTaxes: 140, bizTaxes: 340, note: 'Air France-KLM' },
    ],
  },
  {
    id: 'amsterdam',
    city: 'Amsterdam',
    country: 'Netherlands',
    iata: 'AMS',
    region: 'Europe',
    blurb: 'Canals, bikes, world-class museums, and easy rail across the continent.',
    tags: ['canals', 'museums', 'cycling', 'walkable'],
    typicalEconUSD: 740,
    typicalBizUSD: 2900,
    awards: [
      { program: 'flyingblue', econMiles: 30000, bizMiles: 108000, econTaxes: 220, bizTaxes: 420, note: 'KLM home hub, frequent Promo Rewards' },
      { program: 'virginatlantic', econMiles: 30000, bizMiles: 100000, econTaxes: 200, bizTaxes: 400, note: 'Delta One via Virgin Atlantic' },
    ],
  },
  {
    id: 'reykjavik',
    city: 'Reykjavik',
    country: 'Iceland',
    iata: 'KEF',
    region: 'Europe',
    blurb: 'Waterfalls, lagoons, and the northern lights — the shortest hop to Europe.',
    tags: ['nature', 'adventure', 'short-haul', 'value'],
    typicalEconUSD: 560,
    typicalBizUSD: 1800,
    awards: [
      { program: 'avios', econMiles: 22000, bizMiles: 70000, econTaxes: 110, bizTaxes: 240, note: 'Short transatlantic, low award cost' },
      { program: 'flyingblue', econMiles: 25000, bizMiles: 80000, econTaxes: 120, bizTaxes: 260, note: 'Air France-KLM via Amsterdam' },
    ],
  },
  {
    id: 'athens',
    city: 'Athens',
    country: 'Greece',
    iata: 'ATH',
    region: 'Europe',
    blurb: 'The Acropolis, island-hopping launchpad, and Mediterranean summers.',
    tags: ['history', 'islands', 'beach', 'food'],
    typicalEconUSD: 900,
    typicalBizUSD: 3300,
    awards: [
      { program: 'avios', econMiles: 34000, bizMiles: 120000, econTaxes: 190, bizTaxes: 400, note: 'Iberia/Aegean via Avios' },
      { program: 'flyingblue', econMiles: 36000, bizMiles: 124000, econTaxes: 160, bizTaxes: 360, note: 'Air France-KLM' },
    ],
  },
  {
    id: 'istanbul',
    city: 'Istanbul',
    country: 'Turkey',
    iata: 'IST',
    region: 'Europe',
    blurb: 'Where Europe meets Asia — bazaars, mosques, and incredible food.',
    tags: ['culture', 'food', 'history', 'value'],
    typicalEconUSD: 820,
    typicalBizUSD: 3200,
    awards: [
      { program: 'avios', econMiles: 36000, bizMiles: 128000, econTaxes: 150, bizTaxes: 320, note: 'Turkish via partner; or Aegean via Avios' },
      { program: 'flyingblue', econMiles: 38000, bizMiles: 130000, econTaxes: 160, bizTaxes: 340, note: 'Air France-KLM' },
    ],
  },
  {
    id: 'dublin',
    city: 'Dublin',
    country: 'Ireland',
    iata: 'DUB',
    region: 'Europe',
    blurb: 'Pubs, cliffs, and the friendliest entry point to Europe.',
    tags: ['pubs', 'nature', 'short-haul', 'walkable'],
    typicalEconUSD: 640,
    typicalBizUSD: 2400,
    awards: [
      { program: 'avios', econMiles: 24000, bizMiles: 90000, econTaxes: 130, bizTaxes: 300, note: 'Aer Lingus/BA via Avios' },
      { program: 'flyingblue', econMiles: 28000, bizMiles: 95000, econTaxes: 120, bizTaxes: 280, note: 'Air France-KLM' },
    ],
  },
  {
    id: 'tokyo',
    city: 'Tokyo',
    country: 'Japan',
    iata: 'HND',
    region: 'Asia',
    blurb: 'Neon, temples, the best food on earth, and famously good award space.',
    tags: ['food', 'culture', 'tech', 'shopping'],
    typicalEconUSD: 1150,
    typicalBizUSD: 4800,
    awards: [
      { program: 'ana', econMiles: 75000, bizMiles: 110000, econTaxes: 180, bizTaxes: 350, note: 'ANA round-trip awards are a top sweet spot' },
      { program: 'virginatlantic', econMiles: 60000, bizMiles: 95000, econTaxes: 200, bizTaxes: 400, note: 'ANA business via Virgin Atlantic when bookable' },
      { program: 'avios', econMiles: 60000, bizMiles: 130000, econTaxes: 200, bizTaxes: 420, note: 'JAL via Avios distance bands' },
    ],
  },
  {
    id: 'seoul',
    city: 'Seoul',
    country: 'South Korea',
    iata: 'ICN',
    region: 'Asia',
    blurb: 'Palaces, K-everything, 24-hour food, and a transit hub for all of Asia.',
    tags: ['food', 'culture', 'shopping', 'nightlife'],
    typicalEconUSD: 1100,
    typicalBizUSD: 4600,
    awards: [
      { program: 'flyingblue', econMiles: 60000, bizMiles: 145000, econTaxes: 200, bizTaxes: 420, note: 'Korean/partners' },
      { program: 'avios', econMiles: 62000, bizMiles: 140000, econTaxes: 220, bizTaxes: 440, note: 'Cathay/partners via Avios' },
    ],
  },
  {
    id: 'tokyo-narita-bangkok',
    city: 'Bangkok',
    country: 'Thailand',
    iata: 'BKK',
    region: 'Asia',
    blurb: 'Street food, temples, and the cheapest launchpad into Southeast Asia.',
    tags: ['food', 'beach', 'value', 'nightlife'],
    typicalEconUSD: 1050,
    typicalBizUSD: 4500,
    awards: [
      { program: 'avios', econMiles: 70000, bizMiles: 150000, econTaxes: 230, bizTaxes: 460, note: 'Cathay/Qatar via Avios' },
      { program: 'ana', econMiles: 85000, bizMiles: 130000, econTaxes: 200, bizTaxes: 400, note: 'ANA round-the-world value' },
    ],
  },
  {
    id: 'singapore',
    city: 'Singapore',
    country: 'Singapore',
    iata: 'SIN',
    region: 'Asia',
    blurb: 'Hawker centers, gardens in the sky, and a flawless first-time Asia trip.',
    tags: ['food', 'modern', 'clean', 'family'],
    typicalEconUSD: 1250,
    typicalBizUSD: 5200,
    awards: [
      { program: 'krisflyer', econMiles: 76000, bizMiles: 152000, econTaxes: 180, bizTaxes: 400, note: 'Singapore Airlines Saver awards' },
      { program: 'avios', econMiles: 80000, bizMiles: 160000, econTaxes: 220, bizTaxes: 460, note: 'Qatar via Avios' },
    ],
  },
  {
    id: 'bali',
    city: 'Bali',
    country: 'Indonesia',
    iata: 'DPS',
    region: 'Asia',
    blurb: 'Rice terraces, surf, and temples — the bucket-list beach escape.',
    tags: ['beach', 'nature', 'wellness', 'value'],
    typicalEconUSD: 1300,
    typicalBizUSD: 5400,
    awards: [
      { program: 'krisflyer', econMiles: 82000, bizMiles: 165000, econTaxes: 200, bizTaxes: 420, note: 'Singapore Airlines via SIN' },
      { program: 'flyingblue', econMiles: 85000, bizMiles: 170000, econTaxes: 220, bizTaxes: 440, note: 'KLM/Garuda partners' },
    ],
  },
  {
    id: 'hongkong',
    city: 'Hong Kong',
    country: 'Hong Kong',
    iata: 'HKG',
    region: 'Asia',
    blurb: 'Skyline, dim sum, hiking trails, and a gateway to mainland China.',
    tags: ['food', 'skyline', 'hiking', 'shopping'],
    typicalEconUSD: 1150,
    typicalBizUSD: 4900,
    awards: [
      { program: 'avios', econMiles: 70000, bizMiles: 150000, econTaxes: 200, bizTaxes: 440, note: 'Cathay Pacific via Avios' },
      { program: 'ana', econMiles: 80000, bizMiles: 125000, econTaxes: 180, bizTaxes: 380, note: 'ANA/partners' },
    ],
  },
  {
    id: 'taipei',
    city: 'Taipei',
    country: 'Taiwan',
    iata: 'TPE',
    region: 'Asia',
    blurb: 'Night markets, hot springs, and underrated value across the board.',
    tags: ['food', 'value', 'nature', 'culture'],
    typicalEconUSD: 1080,
    typicalBizUSD: 4400,
    awards: [
      { program: 'avios', econMiles: 68000, bizMiles: 145000, econTaxes: 190, bizTaxes: 420, note: 'Cathay/JAL via Avios' },
      { program: 'krisflyer', econMiles: 78000, bizMiles: 150000, econTaxes: 180, bizTaxes: 400, note: 'EVA/partners' },
    ],
  },
]
