import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react"

/* ============================================================
   Sako Trackeur — bibliothèque de composants (tokens sémantiques)
   Tous les styles dérivent des variables --canvas/--surface/...
   définies dans index.css : un seul endroit pour thèmer l'app.
   ============================================================ */

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ")

const inputClass =
  "w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-content outline-none transition placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20"

/* ----------------------------------------------------------- Field / Input */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, className)} {...props} />
}

/** Champ texte labellisé (compat arrière : Login/Register l'utilisent). */
export function TextField({
  label,
  error,
  className,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-content">{label}</span>
      <input
        {...props}
        className={cn(
          inputClass,
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className
        )}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

/* ----------------------------------------------------------- Button */
type ButtonVariant = "primary" | "subtle" | "ghost" | "danger"
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover shadow-sm",
  subtle: "border border-border bg-surface-2 text-content hover:border-border-strong",
  ghost: "text-muted hover:bg-surface-2 hover:text-content",
  danger:
    "text-danger ring-1 ring-inset ring-danger/30 hover:bg-danger/10",
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
}

/* ----------------------------------------------------------- Card */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-border bg-surface shadow-sm", className)}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-content">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

/* ----------------------------------------------------------- PageHeader */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-content">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/* ----------------------------------------------------------- StatCard */
type Tone = "default" | "accent" | "gold" | "positive" | "negative"
const toneText: Record<Tone, string> = {
  default: "text-content",
  accent: "text-accent",
  gold: "text-gold",
  positive: "text-positive",
  negative: "text-negative",
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: Tone
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-faint">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tnum", toneText[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  )
}

/* ----------------------------------------------------------- ProgressBar */
type BarTone = "accent" | "gold" | "danger" | "positive"
const barTone: Record<BarTone, string> = {
  accent: "bg-accent",
  gold: "bg-gold",
  danger: "bg-danger",
  positive: "bg-positive",
}

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: BarTone }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className={cn("h-full rounded-full transition-all", barTone[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ----------------------------------------------------------- Badge */
const badgeTones: Record<Tone, string> = {
  default: "bg-surface-2 text-muted ring-border",
  accent: "bg-accent/10 text-accent ring-accent/25",
  gold: "bg-gold/10 text-gold ring-gold/30",
  positive: "bg-positive/10 text-positive ring-positive/25",
  negative: "bg-danger/10 text-danger ring-danger/25",
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        badgeTones[tone]
      )}
    >
      {children}
    </span>
  )
}

/* ----------------------------------------------------------- EmptyState */
export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-content">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

/* ----------------------------------------------------------- Alert */
export function Alert({
  tone = "error",
  className,
  children,
}: {
  tone?: "success" | "error"
  className?: string
  children: ReactNode
}) {
  const tones = {
    success: "border-positive/25 bg-positive/10 text-positive",
    error: "border-danger/25 bg-danger/10 text-danger",
  }
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm", tones[tone], className)}>
      {children}
    </div>
  )
}

/* ----------------------------------------------------------- Spinner */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent",
        className
      )}
    />
  )
}
