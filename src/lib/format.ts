export function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function usdCents(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function miles(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: n % 1000 === 0 ? 0 : 1 })}k`
  return n.toLocaleString('en-US')
}

export function pct(n: number): string {
  const v = Math.round(n)
  return `${v > 0 ? '+' : ''}${v}%`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function dateRange(out: string, back: string): string {
  return `${fmtDate(out)} – ${fmtDate(back)}`
}

export function tripNights(out: string, back: string): number {
  const a = new Date(out + 'T00:00:00').getTime()
  const b = new Date(back + 'T00:00:00').getTime()
  return Math.round((b - a) / 86_400_000)
}
