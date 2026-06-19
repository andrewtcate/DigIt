import { useState } from 'react'
import type { Deal } from '../state/useDeals'
import type { Cabin, Mode } from '../types'
import { Badge } from './Badge'
import { dateRange, miles as fmtMiles, pct, tripNights, usd } from '../lib/format'
import { formatDrive } from '../lib/geo'
import type { DealEconomics, Redemption } from '../lib/points'
import type { DealAssessment } from '../lib/baseline'

function DealFlag({ a }: { a: DealAssessment }) {
  if (a.tier === 'none') return null
  const tone = a.tier === 'great' ? 'green' : 'amber'
  const label = a.tier === 'great' ? 'Unusually cheap' : 'Below typical'
  return (
    <Badge tone={tone} title={`${a.learned ? `Learned from ${a.samples} scans` : 'Seed estimate'}; baseline ${usd(a.baseline)}`}>
      {label} · {pct(-a.pctBelow)}
    </Badge>
  )
}

function Steps({ r }: { r: Redemption }) {
  return (
    <ol className="mt-2 space-y-1">
      {r.steps.map((s, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-600">
          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
            {i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  )
}

// What you'd book today with current balances.
function ReadyNowBox({ econ }: { econ: DealEconomics }) {
  const r = econ.readyNow
  if (r.via === 'cash') {
    const cheaperWithPoints = econ.bestAward && econ.bestAward.cashOutOfPocket < r.cashOutOfPocket
    return (
      <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Best today: pay cash</span>
          <span className="text-base font-bold text-slate-900">{usd(r.cashOutOfPocket)}</span>
        </div>
        {cheaperWithPoints && (
          <p className="mt-1 text-xs text-violet-700">
            Cheaper with points — switch to “Best deal if I acquire points”.
          </p>
        )}
      </div>
    )
  }
  const saved = econ.cashPrice - r.cashOutOfPocket
  return (
    <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-inset ring-emerald-200">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
          <Badge tone="green">Ready now</Badge> Book with points
        </span>
        <span className="text-right">
          <span className="block text-base font-bold text-slate-900">{usd(r.cashOutOfPocket)} cash</span>
          <span className="block text-xs text-emerald-700">
            saves {usd(saved)} · {r.centsPerPoint.toFixed(1)}¢/pt
          </span>
        </span>
      </div>
      <Steps r={r} />
    </div>
  )
}

// The best possible redemption, even if it needs points you don't hold.
function AspirationalBox({ econ }: { econ: DealEconomics }) {
  const r = econ.bestAward
  if (!r) {
    return (
      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
        No award sweet spot for this route — pay {usd(econ.cashPrice)} cash.
      </div>
    )
  }
  const saved = econ.cashPrice - r.cashOutOfPocket
  const feasible = r.feasibleNow

  return (
    <div
      className={`rounded-xl p-3 ring-1 ring-inset ${
        feasible ? 'bg-emerald-50 ring-emerald-200' : 'bg-violet-50 ring-violet-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          {feasible ? (
            <Badge tone="green">Ready now</Badge>
          ) : (
            <Badge tone="violet">Aspirational</Badge>
          )}
          Best value
        </span>
        <span className="text-right">
          <span className="block text-base font-bold text-slate-900">{usd(r.cashOutOfPocket)} cash</span>
          <span className="block text-xs text-slate-600">
            + {fmtMiles(r.pointsNeeded)} {r.currencyName} · {r.centsPerPoint.toFixed(1)}¢/pt
          </span>
        </span>
      </div>
      <Steps r={r} />

      {!feasible && (
        <div className="mt-3 border-t border-violet-200 pt-2.5">
          <p className="text-sm font-semibold text-violet-800">
            You have {fmtMiles(r.haveBalance)} {r.currencyName} — needs {fmtMiles(r.pointsNeeded)}.{' '}
            <span className="text-violet-900">Short {fmtMiles(r.gap)}.</span>
          </p>
          {econ.aspirational && (
            <ul className="mt-1.5 space-y-1">
              {econ.aspirational.options.map((o, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600">
                  <span className="text-violet-500">▸</span>
                  {o}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Saves {usd(saved)} vs. the {usd(econ.cashPrice)} cash fare.
          </p>
        </div>
      )}
    </div>
  )
}

export function DealCard({
  deal,
  rank,
  mode,
  cabin,
}: {
  deal: Deal
  rank: number
  mode: Mode
  cabin: Cabin
}) {
  const [showPremium, setShowPremium] = useState(false)
  const main = cabin === 'business' ? 'business' : 'economy'
  const econ = main === 'business' ? deal.bizEconomics : deal.econEconomics
  const price = main === 'business' ? deal.bizPrice : deal.econPrice
  const assessment = main === 'business' ? deal.bizAssessment : deal.econAssessment
  const origin = main === 'business' ? deal.bizOrigin : deal.econOrigin
  const d = deal.destination

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white card-shadow">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {rank}
            </span>
            <h2 className="truncate text-lg font-bold text-slate-900">
              {d.city}, {d.country}
            </h2>
            <Badge tone="blue">{d.region}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{d.blurb}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="font-medium">
              {origin.iata} → {d.iata}
            </span>
            <span className="text-slate-400">·</span>
            <span>
              {dateRange(deal.dateOut, deal.dateBack)} · {tripNights(deal.dateOut, deal.dateBack)} nights
            </span>
            {!origin.isHome && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-amber-700">
                  from {origin.city} ({formatDrive(origin.driveMinutes)})
                </span>
              </>
            )}
            {origin.isHome && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700">home airport</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-2xl font-extrabold text-slate-900">{usd(price)}</div>
          <div className="text-xs text-slate-400">{main === 'business' ? 'business' : 'economy'} · round trip</div>
          <div className="mt-1.5 flex flex-col items-end gap-1">
            <DealFlag a={assessment} />
          </div>
        </div>
      </div>

      {/* Separate premium-cabin flag (mistake fares / sales / award sweet spots) */}
      {main === 'economy' && deal.premiumDeal && (
        <button
          onClick={() => setShowPremium((s) => !s)}
          className="flex w-full items-center justify-between border-t border-slate-100 bg-violet-50/60 px-5 py-2.5 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-violet-800">
            <Badge tone="violet">Premium-cabin deal</Badge>
            Business {usd(deal.bizPrice)} · {pct(-deal.bizAssessment.pctBelow)} vs typical
          </span>
          <span className="text-violet-500">{showPremium ? '▲' : '▼'}</span>
        </button>
      )}
      {showPremium && (
        <div className="border-t border-slate-100 px-5 py-3">
          <AspirationalBox econ={deal.bizEconomics} />
        </div>
      )}

      <div className="border-t border-slate-100 px-5 py-4">
        {mode === 'haveNow' ? <ReadyNowBox econ={econ} /> : <AspirationalBox econ={econ} />}
      </div>
    </div>
  )
}
