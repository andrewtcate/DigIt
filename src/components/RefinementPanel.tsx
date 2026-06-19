import { useState } from 'react'
import { useSettings } from '../state/settingsContext'
import { HomeCityField } from './HomeCity'
import { inferDepartureAirports, formatDrive } from '../lib/geo'
import { BANK_PROGRAMS, AIRLINE_PROGRAMS } from '../data/transferPartners'
import type { Cabin } from '../types'
import { usd } from '../lib/format'

const CABINS: { value: Cabin; label: string }[] = [
  { value: 'any', label: 'Any' },
  { value: 'economy', label: 'Economy' },
  { value: 'premium', label: 'Premium' },
  { value: 'business', label: 'Business' },
]

const MONTHS = [
  { value: 2, label: 'Next 2 months' },
  { value: 4, label: 'Next 4 months' },
  { value: 6, label: 'Next 6 months' },
  { value: 12, label: 'Next 12 months' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  )
}

export function RefinementPanel() {
  const { settings, setMaxDrive, toggleAirport, setBudget, setBalance, setCabin, setMonthsAhead, resetSettings } =
    useSettings()
  const [open, setOpen] = useState(false)

  // Wider pool so the user can re-add nearby airports they removed.
  const pool = inferDepartureAirports(settings.homeLat, settings.homeLng, {
    maxDriveMinutes: Math.max(settings.maxDriveMinutes, 360),
    maxAirports: 12,
  })
  const selected = new Set(settings.departureAirports.map((a) => a.iata))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white card-shadow">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          <span aria-hidden>⚙️</span> Refine results
          <span className="text-sm font-normal text-slate-400">(optional)</span>
        </span>
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <Section title="Home city">
            <div className="max-w-md">
              <HomeCityField />
            </div>
          </Section>

          <Section title={`Departure airports · max ${formatDrive(settings.maxDriveMinutes)}`}>
            <input
              type="range"
              min={30}
              max={300}
              step={15}
              value={settings.maxDriveMinutes}
              onChange={(e) => setMaxDrive(Number(e.target.value))}
              className="mb-3 w-full max-w-md accent-blue-600"
            />
            <div className="flex flex-wrap gap-2">
              {pool.map((a) => {
                const on = selected.has(a.iata)
                return (
                  <button
                    key={a.iata}
                    onClick={() => toggleAirport(a.iata)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                      on
                        ? 'bg-blue-600 text-white ring-blue-600'
                        : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                    }`}
                    title={`${a.name} · ${a.isHome ? 'home airport' : formatDrive(a.driveMinutes)}`}
                  >
                    {a.iata}
                    <span className={`ml-1.5 text-xs ${on ? 'text-blue-100' : 'text-slate-400'}`}>
                      {a.isHome ? 'home' : `${a.driveMinutes}m`}
                    </span>
                  </button>
                )
              })}
            </div>
          </Section>

          <Section title="Cash budget">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                min={0}
                step={50}
                value={settings.cashBudgetUSD ?? ''}
                placeholder="No limit"
                onChange={(e) => setBudget(e.target.value === '' ? null : Number(e.target.value))}
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {settings.cashBudgetUSD != null && (
                <button onClick={() => setBudget(null)} className="text-sm text-blue-600 hover:underline">
                  clear
                </button>
              )}
            </div>
          </Section>

          <Section title="Rewards balances">
            <p className="mb-2 -mt-1 text-xs text-slate-400">
              Enter what you hold. Leave blank to rank by cash only.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.values(BANK_PROGRAMS).map((p) => (
                <label key={p.id} className="text-sm">
                  <span className="mb-1 block font-medium text-slate-600">{p.shortName}</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={settings.balances[p.id] ?? ''}
                    placeholder="0"
                    onChange={(e) => setBalance(p.id, Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              ))}
              {Object.values(AIRLINE_PROGRAMS).map((p) => (
                <label key={p.id} className="text-sm">
                  <span className="mb-1 block truncate font-medium text-slate-600" title={p.name}>
                    {p.name.split(' ')[0]} miles
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={settings.balances[p.id] ?? ''}
                    placeholder="0"
                    onChange={(e) => setBalance(p.id, Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section title="Date flexibility">
            <div className="flex flex-wrap gap-2">
              {MONTHS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMonthsAhead(m.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                    settings.monthsAhead === m.value
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Cabin preference">
            <div className="flex flex-wrap gap-2">
              {CABINS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCabin(c.value)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
                    settings.cabin === c.value
                      ? 'bg-blue-600 text-white ring-blue-600'
                      : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </Section>

          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={resetSettings}
              className="text-sm font-medium text-slate-500 hover:text-red-600"
            >
              Reset all settings
            </button>
            <span className="ml-3 text-xs text-slate-400">
              Budget {settings.cashBudgetUSD != null ? usd(settings.cashBudgetUSD) : 'none'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
