import type { ReactNode } from "react"

/**
 * Donut (anneau) SVG : segments colorés via strokeDasharray.
 * Le centre est un overlay HTML (pour afficher un total/label).
 */
type DonutItem = { value: number; color: string }

export function DonutChart({
  data,
  size = 184,
  thickness = 26,
  center,
}: {
  data: DonutItem[]
  size?: number
  thickness?: number
  center?: ReactNode
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2
  let offset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* piste de fond */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={thickness}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {total > 0 &&
            data.map((d, i) => {
              const len = (d.value / total) * circumference
              const seg = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += len
              return seg
            })}
        </g>
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center}
        </div>
      )}
    </div>
  )
}
