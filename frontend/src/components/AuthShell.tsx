import type { FormEvent, ReactNode } from "react"

/** Coquille des pages d'authentification : fond thématique + halo + brand. */
export default function AuthShell({
  title,
  subtitle,
  footer,
  onSubmit,
  children,
}: {
  title: string
  subtitle: string
  footer: ReactNode
  onSubmit: (e: FormEvent) => void
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {/* Halo radial subtil (couleur d'accent du thème) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at center, var(--accent), transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-bold text-accent-fg shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-content">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            {children}
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  )
}
