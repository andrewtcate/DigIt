import { useState } from 'react'
import { geocodeCity } from '../data/cities'
import { useSettings } from '../state/settingsContext'

// Free-text home-city field with bundled geocoding. Used both in the one-time
// confirmation banner and in the refinement panel.
function HomeCityField({ onDone }: { onDone?: () => void }) {
  const { settings, setHome } = useSettings()
  const [value, setValue] = useState(settings.homeLabel)
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const hit = geocodeCity(value)
    if (!hit) {
      setError("Couldn't find that city — try a nearby major city, e.g. \"Tampa, FL\".")
      return
    }
    setError(null)
    setHome(hit.label, hit.lat, hit.lng)
    setValue(hit.label)
    onDone?.()
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="City, ST"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={submit}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Set
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export { HomeCityField }

// One-time confirmation: results are already showing from the default/saved
// city; the user confirms or corrects it exactly once.
export function HomeCityBanner() {
  const { settings, setHome } = useSettings()
  const [editing, setEditing] = useState(false)
  if (settings.configured) return null

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      {!editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">
            Showing deals departing near <span className="font-semibold">{settings.homeLabel}</span>. Is
            that your home base?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setHome(settings.homeLabel, settings.homeLat, settings.homeLng)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Yes, that's me
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 hover:bg-blue-50"
            >
              Change city
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-md">
          <p className="mb-2 text-sm font-medium text-slate-700">Where do you fly from?</p>
          <HomeCityField onDone={() => setEditing(false)} />
        </div>
      )}
    </div>
  )
}
