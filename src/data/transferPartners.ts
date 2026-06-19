// ─────────────────────────────────────────────────────────────────────────
// EDITABLE CONFIG: transferable-points programs, their airline/hotel transfer
// partners and ratios, card signup bonuses, and rough point valuations.
//
// This is intentionally a plain data file so it is easy to keep current — ratios
// and bonuses change. Numbers reflect well-known public values as of 2026 and
// should be reviewed periodically. `ratio` is airline-miles received per 1,000
// bank points (so 1000 = 1:1, 800 = 5:4 transfers like Citi→some partners).
// ─────────────────────────────────────────────────────────────────────────

export type ProgramKind = 'bank' | 'airline' | 'hotel'

export interface AirlineProgram {
  id: string
  name: string
  kind: 'airline'
}

// Airline (and a couple of hotel) loyalty programs that awards are priced in.
export const AIRLINE_PROGRAMS: Record<string, AirlineProgram> = {
  avios: { id: 'avios', name: 'British Airways / Iberia / Aer Lingus Avios', kind: 'airline' },
  flyingblue: { id: 'flyingblue', name: 'Air France-KLM Flying Blue', kind: 'airline' },
  virginatlantic: { id: 'virginatlantic', name: 'Virgin Atlantic Flying Club', kind: 'airline' },
  ana: { id: 'ana', name: 'ANA Mileage Club', kind: 'airline' },
  krisflyer: { id: 'krisflyer', name: 'Singapore KrisFlyer', kind: 'airline' },
  aeroplan: { id: 'aeroplan', name: 'Air Canada Aeroplan', kind: 'airline' },
  united: { id: 'united', name: 'United MileagePlus', kind: 'airline' },
  delta: { id: 'delta', name: 'Delta SkyMiles', kind: 'airline' },
}

export interface TransferPartner {
  program: string // AIRLINE_PROGRAMS key
  ratio: number // airline miles per 1,000 bank points (1000 = 1:1)
}

export interface BankProgram {
  id: string
  name: string
  shortName: string
  kind: 'bank'
  // Rough cash value of one point in cents, for ranking aspirational value.
  cpp: number
  partners: TransferPartner[]
}

// Bank transferable-currency programs and their airline transfer partners.
export const BANK_PROGRAMS: Record<string, BankProgram> = {
  amex: {
    id: 'amex',
    name: 'American Express Membership Rewards',
    shortName: 'Amex MR',
    kind: 'bank',
    cpp: 2.0,
    partners: [
      { program: 'avios', ratio: 1000 },
      { program: 'flyingblue', ratio: 1000 },
      { program: 'virginatlantic', ratio: 1000 },
      { program: 'ana', ratio: 1000 },
      { program: 'krisflyer', ratio: 1000 },
      { program: 'aeroplan', ratio: 1000 },
      { program: 'delta', ratio: 1000 },
    ],
  },
  chase: {
    id: 'chase',
    name: 'Chase Ultimate Rewards',
    shortName: 'Chase UR',
    kind: 'bank',
    cpp: 2.0,
    partners: [
      { program: 'avios', ratio: 1000 },
      { program: 'flyingblue', ratio: 1000 },
      { program: 'virginatlantic', ratio: 1000 },
      { program: 'krisflyer', ratio: 1000 },
      { program: 'aeroplan', ratio: 1000 },
      { program: 'united', ratio: 1000 },
    ],
  },
  capitalone: {
    id: 'capitalone',
    name: 'Capital One Miles',
    shortName: 'Cap One',
    kind: 'bank',
    cpp: 1.85,
    partners: [
      { program: 'avios', ratio: 1000 },
      { program: 'flyingblue', ratio: 1000 },
      { program: 'virginatlantic', ratio: 1000 },
      { program: 'aeroplan', ratio: 1000 },
      { program: 'krisflyer', ratio: 1000 },
      { program: 'ana', ratio: 1000 },
    ],
  },
  citi: {
    id: 'citi',
    name: 'Citi ThankYou Points',
    shortName: 'Citi TY',
    kind: 'bank',
    cpp: 1.8,
    partners: [
      { program: 'avios', ratio: 1000 },
      { program: 'flyingblue', ratio: 1000 },
      { program: 'virginatlantic', ratio: 1000 },
      { program: 'krisflyer', ratio: 1000 },
      { program: 'aeroplan', ratio: 1000 },
    ],
  },
  bilt: {
    id: 'bilt',
    name: 'Bilt Rewards',
    shortName: 'Bilt',
    kind: 'bank',
    cpp: 1.9,
    partners: [
      { program: 'avios', ratio: 1000 },
      { program: 'flyingblue', ratio: 1000 },
      { program: 'virginatlantic', ratio: 1000 },
      { program: 'aeroplan', ratio: 1000 },
      { program: 'united', ratio: 1000 },
    ],
  },
}

// Direct airline-mile balances the user may hold (no transfer needed).
// These are the same ids as AIRLINE_PROGRAMS and can be entered directly.
export const DIRECT_AIRLINE_BALANCE_PROGRAMS = Object.keys(AIRLINE_PROGRAMS)

export interface SignupBonus {
  card: string
  program: string // BANK_PROGRAMS key the bonus lands in
  points: number
  minSpend: number
  spendWindowMonths: number
  annualFee: number
  note: string
}

// A short list of strong, well-known signup bonuses — the fastest way to close
// an aspirational points gap. Review periodically; offers change frequently.
export const SIGNUP_BONUSES: SignupBonus[] = [
  { card: 'Chase Sapphire Preferred', program: 'chase', points: 60000, minSpend: 4000, spendWindowMonths: 3, annualFee: 95, note: 'Transfers to Avios, Flying Blue, United, Aeroplan and more 1:1.' },
  { card: 'Chase Sapphire Reserve', program: 'chase', points: 60000, minSpend: 4000, spendWindowMonths: 3, annualFee: 550, note: 'Same transfer partners as CSP, plus travel credits.' },
  { card: 'Amex Gold', program: 'amex', points: 60000, minSpend: 6000, spendWindowMonths: 6, annualFee: 325, note: 'Transfers to Avios, Flying Blue, ANA, Virgin Atlantic 1:1.' },
  { card: 'Amex Platinum', program: 'amex', points: 80000, minSpend: 8000, spendWindowMonths: 6, annualFee: 695, note: 'Largest transferable bonus; same MR partners.' },
  { card: 'Capital One Venture X', program: 'capitalone', points: 75000, minSpend: 4000, spendWindowMonths: 3, annualFee: 395, note: 'Transfers to Avios, Flying Blue, Virgin, ANA 1:1.' },
  { card: 'Citi Strata Premier', program: 'citi', points: 75000, minSpend: 4000, spendWindowMonths: 3, annualFee: 95, note: 'Transfers to Avios, Flying Blue, Virgin, KrisFlyer 1:1.' },
  { card: 'Bilt (no annual fee)', program: 'bilt', points: 0, minSpend: 0, spendWindowMonths: 0, annualFee: 0, note: 'Earn by paying rent; no signup bonus but no fee, transfers 1:1.' },
]
