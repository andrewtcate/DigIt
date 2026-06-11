/** Number / currency formatting helpers shared by every panel. */

export function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Compact money: 1234567 -> $1.23M (input in raw dollars). */
export function fmtMoney(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(decimals)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(decimals)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(decimals)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(decimals)}K`
  return `${sign}$${abs.toFixed(decimals)}`
}

/** Millions input (financial statements are stored in $M). */
export function fmtMillions(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  return fmtMoney(v * 1e6, decimals)
}

export function fmtPct(v: number | null | undefined, decimals = 2, signed = false): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const s = signed && v > 0 ? '+' : ''
  return `${s}${(v * 100).toFixed(decimals)}%`
}

export function fmtPrice(v: number | null | undefined): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtSigned(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  return `${v > 0 ? '+' : ''}${fmtNum(v, decimals)}`
}

export function fmtCompact(v: number | null | undefined, decimals = 1): string {
  if (v === null || v === undefined || !isFinite(v)) return '—'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(decimals)}T`
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)}K`
  return `${sign}${abs.toFixed(decimals)}`
}

export function fmtDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateShort(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/** Tailwind class for up/down/flat coloring. */
export function chgClass(v: number | null | undefined): string {
  if (v === null || v === undefined || !isFinite(v) || v === 0) return 'text-zinc-400'
  return v > 0 ? 'text-up' : 'text-down'
}

export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
