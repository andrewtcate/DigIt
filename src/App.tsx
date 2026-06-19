import { useMemo, useState } from 'react'
import { SettingsProvider } from './state/store'
import { useSettings } from './state/settingsContext'
import { rankDeals, useDeals } from './state/useDeals'
import { hasBalances } from './lib/points'
import type { Mode } from './types'
import { HomeCityBanner } from './components/HomeCity'
import { ModeToggle } from './components/ModeToggle'
import { RefinementPanel } from './components/RefinementPanel'
import { DealCard } from './components/DealCard'
import { Badge } from './components/Badge'
import { usd } from './lib/format'

function Dashboard() {
  const { settings } = useSettings()
  const { deals, loading, source, note, refresh } = useDeals(settings)
  const [mode, setMode] = useState<Mode>('haveNow')

  const ranked = useMemo(() => rankDeals(deals, settings, mode), [deals, settings, mode])
  const hasPoints = hasBalances(settings.balances)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
              ✈
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">FareScout</h1>
              <p className="-mt-0.5 text-xs text-slate-500">
                Cheapest international flights from {settings.homeLabel}
              </p>
            </div>
          </div>
          <button
            onClick={refresh}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ↻ Rescan
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge tone={source === 'amadeus' ? 'green' : 'gray'}>
            {source === 'amadeus' ? 'Live: Amadeus' : 'Offline estimates'}
          </Badge>
          <span>
            {settings.departureAirports.map((a) => a.iata).join(' · ')}
          </span>
          {settings.cashBudgetUSD != null && (
            <Badge tone="blue">Budget {usd(settings.cashBudgetUSD)}</Badge>
          )}
          {!hasPoints && <span className="text-slate-400">· add rewards balances to optimize points</span>}
        </div>
        {note && <p className="mt-1.5 text-xs text-amber-600">{note}</p>}
      </header>

      <HomeCityBanner />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ModeToggle mode={mode} onChange={setMode} />
        <span className="text-sm text-slate-500">
          {loading ? 'Scanning…' : `${ranked.length} deals`}
        </span>
      </div>

      <main className="space-y-4">
        {loading && deals.length === 0 ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 card-shadow">
            No deals within your budget. Raise the cash budget or switch to “Best deal if I acquire
            points”.
          </div>
        ) : (
          ranked.map((deal, i) => (
            <DealCard key={deal.destination.id} deal={deal} rank={i + 1} mode={mode} cabin={settings.cabin} />
          ))
        )}
      </main>

      <div className="mt-6">
        <RefinementPanel />
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        FareScout ranks the cheapest realistic option per destination across your nearby airports,
        learns each route&apos;s price baseline over time to flag deals, and optimizes cash + points.
        Award sweet spots and transfer ratios are configurable in{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5">src/data/transferPartners.ts</code>.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <Dashboard />
    </SettingsProvider>
  )
}
