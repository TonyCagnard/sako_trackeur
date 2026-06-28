/**
 * Graphique en aire (aire dégradée + ligne), full-width responsive.
 * SVG en viewBox 100×40 avec preserveAspectRatio="none" pour s'étirer en
 * largeur ; vector-effect="non-scaling-stroke" garde le trait fin.
 */
type Point = { value: number }

export function AreaChart({
  data,
  height = 200,
  className,
}: {
  data: Point[]
  height?: number
  className?: string
}) {
  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-faint"
        style={{ height }}
      >
        Pas encore assez d'historique pour afficher la courbe.
      </div>
    )
  }

  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  // Marges verticales pour que la ligne ne colle pas aux bords.
  const padTop = 0.12
  const padBottom = 0.12
  const W = 100
  const H = 40

  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W
    const norm = (d.value - min) / span
    const y = H * padTop + (1 - norm) * H * (1 - padTop - padBottom)
    return [x, y] as const
  })

  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(2) + " " + p[1].toFixed(2))
    .join(" ")
  const area = `${line} L ${W} ${H} L 0 ${H} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height, display: "block" }}
      role="img"
      aria-label="Évolution du patrimoine"
    >
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent)", stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGradient)" />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
