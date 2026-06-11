interface Props {
  values: number[]
  width?: number
  height?: number
  className?: string
}

/** Tiny inline SVG line chart colored by period performance. */
export default function Sparkline({ values, width = 64, height = 20, className }: Props) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - ((v - min) / span) * (height - 2) - 1).toFixed(1)}`)
    .join(' ')
  const up = values[values.length - 1] >= values[0]
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? '#22c55e' : '#ef4444'}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
