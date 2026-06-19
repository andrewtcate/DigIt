import type { Mode } from '../types'

// The two decisions must not blur together (build prompt §5): book today with
// what you hold, vs. the best possible deal if you're willing to acquire points.
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold ring-1 ring-inset ring-slate-200">
      <button
        onClick={() => onChange('haveNow')}
        className={`rounded-md px-3 py-1.5 transition ${
          mode === 'haveNow' ? 'bg-white text-blue-700 card-shadow' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Book today with what I have
      </button>
      <button
        onClick={() => onChange('aspirational')}
        className={`rounded-md px-3 py-1.5 transition ${
          mode === 'aspirational' ? 'bg-white text-violet-700 card-shadow' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        Best deal if I acquire points
      </button>
    </div>
  )
}
