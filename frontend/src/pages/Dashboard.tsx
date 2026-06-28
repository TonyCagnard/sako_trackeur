import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronRight,
  PiggyBank,
  Receipt,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { AreaChart } from "../components/AreaChart"
import { DonutChart } from "../components/DonutChart"
import { Badge, Card, StatCard } from "../components/ui"

type Summary = {
  today: number
  week: number
  month: number
  total: number
  income_month: number
  balance: number
  income_total: number
  savings_total: number
}

type SeriesPoint = { month: string; value: number }
type BreakItem = { name: string; color: string; amount: number; percent: number }

const CURRENCY: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "C$",
}

const RANGES = [
  { label: "6 mois", months: 6 },
  { label: "1 an", months: 12 },
  { label: "Tout", months: 24 },
] as const

const SHORTCUTS = [
  { to: "/expenses", label: "Ajouter une dépense", icon: Receipt },
  { to: "/revenus", label: "Ajouter un revenu", icon: ArrowUpRight },
  { to: "/conseils", label: "Voir mes conseils IA", icon: Sparkles },
  { to: "/objectifs", label: "Mes objectifs d'épargne", icon: PiggyBank },
] as const

function greeting() {
  const h = new Date().getHours()
  if (h < 6) return "Bonne nuit"
  if (h < 18) return "Bonjour"
  return "Bonsoir"
}

export default function Dashboard() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"
  const symbol = CURRENCY[currency] ?? ""
  const [stats, setStats] = useState<Summary | null>(null)
  const [series, setSeries] = useState<SeriesPoint[]>([])
  const [breakdown, setBreakdown] = useState<{ items: BreakItem[]; total: number }>({
    items: [],
    total: 0,
  })
  const [range, setRange] = useState(12)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Summary>("/analytics/summary/"),
      api.get<{ items: BreakItem[]; total: number }>("/analytics/expense-breakdown/"),
    ])
      .then(([s, b]) => {
        setStats(s.data)
        setBreakdown(b.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api
      .get<{ series: SeriesPoint[] }>(`/analytics/net-worth/?months=${range}`)
      .then((r) => setSeries(r.data.series))
      .catch(() => {})
  }, [range])

  const fmt = (n: number | undefined) =>
    (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency })

  const balance = Number(stats?.balance ?? 0)
  const savingsTotal = Number(stats?.savings_total ?? 0)
  const today = Number(stats?.today ?? 0)
  const week = Number(stats?.week ?? 0)
  const month = Number(stats?.month ?? 0)
  const total = Number(stats?.total ?? 0)

  return (
    <div className="space-y-6">
      {/* Salutation */}
      <div>
        <p className="text-sm text-muted">{greeting()},</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {user?.first_name || user?.username}
        </h1>
      </div>

      {/* Héro : patrimoine total + plage + courbe */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted">
              <Wallet size={16} /> Patrimoine total
            </div>
            <p className="mt-2 text-4xl font-bold tracking-tight tnum text-content sm:text-5xl">
              {loading ? "…" : fmt(savingsTotal)}
            </p>
            {!loading && (
              <div className="mt-3">
                <Badge tone={balance >= 0 ? "positive" : "negative"}>
                  {balance >= 0 ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {balance >= 0 ? "+" : "−"}
                  {fmt(Math.abs(balance))} ce mois
                </Badge>
              </div>
            )}
          </div>

          {/* Tabs de plage */}
          <div className="inline-flex rounded-lg bg-surface-2 p-1">
            {RANGES.map((r) => (
              <button
                key={r.months}
                type="button"
                onClick={() => setRange(r.months)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  range === r.months
                    ? "bg-surface text-content shadow-sm"
                    : "text-muted hover:text-content"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-2 pb-5 sm:px-4">
          {!loading && <AreaChart data={series} height={240} />}
        </div>
      </Card>

      {/* Dépenses : aujourd'hui / semaine / mois / total */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          value={loading ? "…" : fmt(today)}
          icon={<Zap size={16} />}
          hint="Dépenses du jour"
        />
        <StatCard
          label="Cette semaine"
          value={loading ? "…" : fmt(week)}
          icon={<Calendar size={16} />}
          hint="Depuis lundi"
        />
        <StatCard
          label="Ce mois-ci"
          value={loading ? "…" : fmt(month)}
          icon={<Receipt size={16} />}
          tone="negative"
          hint="Dépenses du mois"
        />
        <StatCard
          label="Total dépenses"
          value={loading ? "…" : fmt(total)}
          icon={<Wallet size={16} />}
          hint="Cumul depuis le début"
        />
      </section>

      {/* Répartition par catégorie + raccourcis */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-content">
            Dépenses par catégorie <span className="text-faint">· ce mois</span>
          </h2>
          {breakdown.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Aucune dépense ce mois-ci.
            </p>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <DonutChart
                data={breakdown.items.map((i) => ({ value: i.amount, color: i.color }))}
                center={
                  <>
                    <span className="text-xs text-faint">Total</span>
                    <span className="text-lg font-bold tnum text-content">
                      {fmt(breakdown.total)}
                    </span>
                  </>
                }
              />
              <ul className="w-full flex-1 space-y-2">
                {breakdown.items.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: i.color }}
                    />
                    <span className="flex-1 truncate text-content">{i.name}</span>
                    <span className="text-xs text-faint tnum">{i.percent}%</span>
                    <span className="w-24 text-right font-medium tnum text-content">
                      {fmt(i.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-2">
          <h2 className="px-3 py-3 text-sm font-semibold text-content">
            Raccourcis
          </h2>
          <div className="space-y-0.5">
            {SHORTCUTS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-content"
              >
                <Icon size={16} />
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={16}
                  className="text-faint transition group-hover:text-content"
                />
              </Link>
            ))}
          </div>
          <p className="px-3 pb-2 pt-3 text-xs text-faint">
            Devise : {currency} ({symbol})
          </p>
        </Card>
      </section>
    </div>
  )
}
