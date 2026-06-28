import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Spinner,
} from "../components/ui"

type Prediction = {
  spent_so_far: number
  projected_total: number
  projected_remaining: number
  days_elapsed: number
  days_total: number
}

type Subscription = {
  description: string
  category: string
  monthly: number
  annual: number
  months: number
}

type Unusual = {
  description: string
  category: string
  amount: number
  category_avg: number
  multiplier: number
}

type InsightsData = {
  prediction: Prediction
  subscriptions: Subscription[]
  unusual: Unusual[]
  savings_tips: string[]
}

export default function Insights() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<InsightsData>("/analytics/insights/")
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) =>
    Number(n).toLocaleString("fr-FR", { style: "currency", currency })

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <EmptyState
          title="Conseils indisponibles"
          description="Impossible de charger les conseils pour l'instant. Réessaie plus tard."
        />
      </Card>
    )
  }

  const p = data.prediction

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conseils IA"
        description="Analyses automatiques de tes dépenses, calculées depuis tes données."
      >
        <Badge tone="gold">
          <Sparkles size={14} /> Intelligence
        </Badge>
      </PageHeader>

      {/* Héro prédiction — signature or champagne */}
      <Card className="border-gold/30 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-gold">
          <TrendingUp size={18} />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Prédiction de fin de mois
          </h2>
        </div>
        <p className="mt-3 text-sm text-muted">
          À ce rythme, tu seras à environ{" "}
          <strong className="text-3xl font-bold tnum text-gold sm:text-4xl">
            {fmt(p.projected_total)}
          </strong>{" "}
          de dépenses en fin de mois.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-faint">Dépensé à ce jour</p>
            <p className="mt-0.5 text-lg font-bold tnum text-content">
              {fmt(p.spent_so_far)}
            </p>
          </div>
          <div>
            <p className="text-xs text-faint">Encore ~ à dépenser</p>
            <p className="mt-0.5 text-lg font-bold tnum text-gold">
              {fmt(p.projected_remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-faint">Avancement du mois</p>
            <p className="mt-0.5 text-lg font-bold tnum text-content">
              j{p.days_elapsed}/{p.days_total}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Abonnements */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <RefreshCw size={15} /> Abonnements détectés
              </span>
            }
          />
          {data.subscriptions.length === 0 ? (
            <EmptyState
              title="Aucun abonnement"
              description="Aucun paiement récurrent détecté."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.subscriptions.map((s) => (
                <li
                  key={s.description}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">
                      {s.description}
                    </p>
                    <p className="text-xs text-faint">
                      {s.category} · {s.months} mois
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tnum text-content">
                      {fmt(s.monthly)}/mois
                    </p>
                    <p className="text-xs text-faint">{fmt(s.annual)}/an</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Dépenses inhabituelles */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <AlertTriangle size={15} /> Dépenses inhabituelles
              </span>
            }
          />
          {data.unusual.length === 0 ? (
            <EmptyState
              title="Rien d'inhabituel"
              description="Pas de dépense anormale ce mois-ci."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.unusual.map((u) => (
                <li
                  key={`${u.description}-${u.amount}`}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">
                      {u.description}
                    </p>
                    <p className="text-xs text-faint">
                      {u.category} · moyenne {fmt(u.category_avg)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tnum text-negative">
                      {fmt(u.amount)}
                    </p>
                    <p className="text-xs text-faint">×{u.multiplier}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Propositions d'économies */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Lightbulb size={15} className="text-gold" /> Propositions d'économies
            </span>
          }
        />
        <ul className="space-y-3 p-5">
          {data.savings_tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-content"
            >
              <ArrowRight size={16} className="mt-0.5 shrink-0 text-positive" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
