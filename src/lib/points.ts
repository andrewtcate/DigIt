// Points + cash optimization.
//
// Given a fare's award options (sweet-spot airline programs) and the user's
// balances across bank + airline currencies, compute:
//   • the best redemption bookable TODAY with what they hold ("ready now"), and
//   • the best possible redemption if they were willing to acquire points
//     ("aspirational"), with the exact gap and how to close it (signup bonuses).
// "Out-of-pocket cost" is cash; an award pays only taxes/fees, so when a feasible
// award exists it minimizes cash spend versus paying the full fare.

import {
  AIRLINE_PROGRAMS,
  BANK_PROGRAMS,
  SIGNUP_BONUSES,
} from '../data/transferPartners'
import type { AwardOption, RewardsBalances } from '../types'
import { miles as fmtMiles, usd } from './format'

export interface Redemption {
  via: 'direct' | 'transfer' | 'cash'
  award?: AwardOption
  currencyId: string // program id of the currency spent (bank or airline)
  currencyName: string
  isBank: boolean
  bankProgram?: string
  pointsNeeded: number // in the spent currency
  cashOutOfPocket: number // taxes (award) or full price (cash)
  centsPerPoint: number // value extracted from the points burned
  feasibleNow: boolean
  haveBalance: number
  gap: number // points short of pointsNeeded (0 when feasible)
  steps: string[]
}

export interface AcquisitionPlan {
  program: string // bank program id to earn into
  programName: string
  pointsShort: number
  haveBalance: number
  options: string[]
}

export interface DealEconomics {
  cashPrice: number
  readyNow: Redemption // always present (worst case: pay cash)
  bestAward: Redemption | null // best-value redemption overall (any balance)
  aspirational: AcquisitionPlan | null // set when bestAward isn't feasible now
}

function roundUpThousand(n: number): number {
  return Math.ceil(n / 1000) * 1000
}

// All ways to satisfy one award option, given balances (direct hold + each bank
// transfer partner). Routes are returned whether or not they're feasible now.
function redemptionsForAward(
  award: AwardOption,
  cashPrice: number,
  balances: RewardsBalances,
): Redemption[] {
  const out: Redemption[] = []
  const cashSaved = Math.max(0, cashPrice - award.taxes)
  const airline = AIRLINE_PROGRAMS[award.program]
  const airlineName = airline?.name ?? award.program

  // Direct: hold the airline miles already.
  {
    const have = balances[award.program] ?? 0
    const need = award.miles
    out.push({
      via: 'direct',
      award,
      currencyId: award.program,
      currencyName: airlineName,
      isBank: false,
      pointsNeeded: need,
      cashOutOfPocket: award.taxes,
      centsPerPoint: need ? (cashSaved / need) * 100 : 0,
      feasibleNow: have >= need,
      haveBalance: have,
      gap: Math.max(0, need - have),
      steps: [
        `Redeem ${fmtMiles(need)} ${airlineName} miles (${award.cabin})`,
        `Pay ${usd(award.taxes)} in taxes & fees`,
      ],
    })
  }

  // Transfer: earn bank points, transfer to the airline program.
  for (const [bankId, bank] of Object.entries(BANK_PROGRAMS)) {
    const partner = bank.partners.find((p) => p.program === award.program)
    if (!partner) continue
    const need = roundUpThousand((award.miles / partner.ratio) * 1000)
    const have = balances[bankId] ?? 0
    const ratioLabel = partner.ratio === 1000 ? '1:1' : `1000:${partner.ratio}`
    out.push({
      via: 'transfer',
      award,
      currencyId: bankId,
      currencyName: bank.shortName,
      isBank: true,
      bankProgram: bankId,
      pointsNeeded: need,
      cashOutOfPocket: award.taxes,
      centsPerPoint: need ? (cashSaved / need) * 100 : 0,
      feasibleNow: have >= need,
      haveBalance: have,
      gap: Math.max(0, need - have),
      steps: [
        `Transfer ${fmtMiles(need)} ${bank.shortName} → ${airlineName} (${ratioLabel})`,
        `Book the ${award.cabin} award for ${fmtMiles(award.miles)} miles`,
        `Pay ${usd(award.taxes)} in taxes & fees`,
      ],
    })
  }

  return out
}

const cashRedemption = (cashPrice: number): Redemption => ({
  via: 'cash',
  currencyId: 'cash',
  currencyName: 'Cash',
  isBank: false,
  pointsNeeded: 0,
  cashOutOfPocket: cashPrice,
  centsPerPoint: 0,
  feasibleNow: true,
  haveBalance: 0,
  gap: 0,
  steps: [`Pay ${usd(cashPrice)} cash`],
})

function acquisitionFor(best: Redemption): AcquisitionPlan | null {
  if (best.via !== 'transfer' || !best.bankProgram || best.gap <= 0) return null
  const bank = BANK_PROGRAMS[best.bankProgram]
  const options: string[] = []

  const bonuses = SIGNUP_BONUSES.filter((b) => b.program === best.bankProgram && b.points > 0).sort(
    (a, b) => a.points - b.points,
  )
  const covering = bonuses.find((b) => b.points >= best.gap)
  if (covering) {
    options.push(
      `${covering.card}: ${fmtMiles(covering.points)}-pt signup bonus after ${usd(covering.minSpend)} spend in ${covering.spendWindowMonths} mo (${covering.annualFee === 0 ? 'no annual fee' : usd(covering.annualFee) + ' annual fee'}) — covers the gap.`,
    )
  } else if (bonuses[0]) {
    options.push(
      `${bonuses[0].card}: ${fmtMiles(bonuses[0].points)}-pt signup bonus — a strong start toward the ${fmtMiles(best.gap)} you're short.`,
    )
  }
  options.push(
    `Transfer in from another ${bank.name}-earning card, or earn ${fmtMiles(best.gap)} more through everyday spend.`,
  )

  return {
    program: best.bankProgram,
    programName: bank.name,
    pointsShort: best.gap,
    haveBalance: best.haveBalance,
    options,
  }
}

// Optimize one fare. `cabin` selects which award tier (economy/business) the
// awards array represents — awards already carry their own cabin.
export function optimize(
  cashPrice: number,
  awards: AwardOption[],
  balances: RewardsBalances,
): DealEconomics {
  const all = awards.flatMap((a) => redemptionsForAward(a, cashPrice, balances))

  // Ready now: cheapest cash among feasible awards (ties → best cents/point),
  // else just pay cash.
  const feasible = all.filter((r) => r.feasibleNow)
  feasible.sort((a, b) => a.cashOutOfPocket - b.cashOutOfPocket || b.centsPerPoint - a.centsPerPoint)
  const readyNow = feasible[0] ?? cashRedemption(cashPrice)

  // Best possible value regardless of current balances (the aspirational target).
  // Among equal-value routes prefer ones that are actually *acquirable* — i.e.
  // bank-transfer routes (reachable via signup bonuses) over direct airline
  // holdings, and routes where the user already has partial progress so the gap
  // is concrete. Fewer points needed breaks any remaining tie.
  const bestAward = all.length
    ? [...all].sort((a, b) => {
        if (Math.abs(a.centsPerPoint - b.centsPerPoint) > 0.01)
          return b.centsPerPoint - a.centsPerPoint
        const partial = (r: Redemption) => (r.haveBalance > 0 ? 1 : 0)
        if (partial(a) !== partial(b)) return partial(b) - partial(a)
        const acquirable = (r: Redemption) => (r.via === 'transfer' ? 1 : 0)
        if (acquirable(a) !== acquirable(b)) return acquirable(b) - acquirable(a)
        return a.pointsNeeded - b.pointsNeeded
      })[0]
    : null

  const aspirational =
    bestAward && !bestAward.feasibleNow ? acquisitionFor(bestAward) : null

  return { cashPrice, readyNow, bestAward, aspirational }
}

export function hasBalances(balances: RewardsBalances): boolean {
  return Object.values(balances).some((v) => v > 0)
}
