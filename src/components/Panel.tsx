import type { ReactNode } from 'react'

/** Shared chrome for terminal panels: amber title bar + bordered body. */
export function Panel({ title, right, children, className = '' }: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`border border-line bg-panel flex flex-col min-h-0 ${className}`}>
      <header className="flex items-center justify-between px-2 py-1 border-b border-line bg-panelhead shrink-0">
        <h2 className="text-amber text-[11px] font-bold tracking-widest uppercase">{title}</h2>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  )
}

export function Stat({ label, value, valueClass = 'text-zinc-100' }: {
  label: string
  value: ReactNode
  valueClass?: string
}) {
  return (
    <div className="flex justify-between gap-3 px-2 py-[3px] odd:bg-white/[0.02]">
      <span className="text-zinc-500 whitespace-nowrap">{label}</span>
      <span className={`${valueClass} font-medium text-right tabular-nums`}>{value}</span>
    </div>
  )
}

/** Small amber pill button used in panel headers. */
export function PanelButton({ onClick, active = false, children }: {
  onClick: () => void
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-[2px] text-[10px] font-bold tracking-wider border transition-colors ${
        active
          ? 'bg-amber text-black border-amber'
          : 'border-line text-zinc-400 hover:border-amber/60 hover:text-amber'
      }`}
    >
      {children}
    </button>
  )
}
