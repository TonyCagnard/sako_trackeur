import { useEffect, useState } from "react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"

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
      <div className="flex items-center justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        Impossible de charger les conseils pour l'instant.
      </p>
    )
  }

  const p = data.prediction

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200">
          Intelligence
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          Conseils IA
        </h1>
        <p className="text-sm text-slate-500">
          Analyses automatiques de tes dépenses, calculées depuis tes données.
        </p>
      </div>

      {/* Prédiction fin de mois */}
      <section className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-violet-700">
          <span className="text-lg">📈</span>
          <h2 className="font-semibold">Prédiction de fin de mois</h2>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          À ce rythme, tu seras à environ{" "}
          <strong className="text-xl text-violet-700">
            {fmt(p.projected_total)}
          </strong>{" "}
          de dépenses en fin de mois.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Dépensé à ce jour</p>
            <p className="text-lg font-bold text-slate-900">{fmt(p.spent_so_far)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Encore ~ à dépenser</p>
            <p className="text-lg font-bold text-amber-600">
              {fmt(p.projected_remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Avancement du mois</p>
            <p className="text-lg font-bold text-slate-900">
              j{p.days_elapsed}/{p.days_total}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Abonnements */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span>🔁</span>
            <h2 className="font-semibold text-slate-900">Abonnements détectés</h2>
          </div>
          {data.subscriptions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Aucun abonnement récurrent détecté.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.subscriptions.map((s) => (
                <li
                  key={s.description}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{s.description}</p>
                    <p className="text-xs text-slate-400">
                      {s.category} · {s.months} mois
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {fmt(s.monthly)}/mois
                    </p>
                    <p className="text-xs text-slate-400">{fmt(s.annual)}/an</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Dépenses inhabituelles */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <h2 className="font-semibold text-slate-900">Dépenses inhabituelles</h2>
          </div>
          {data.unusual.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Rien d'inhabituel ce mois-ci. 👍</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.unusual.map((u) => (
                <li
                  key={`${u.description}-${u.amount}`}
                  className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.description}</p>
                    <p className="text-xs text-slate-400">
                      {u.category} · moyenne {fmt(u.category_avg)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-rose-600">{fmt(u.amount)}</p>
                    <p className="text-xs text-rose-400">×{u.multiplier}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Conseils d'économies */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span>💡</span>
          <h2 className="font-semibold text-slate-900">Propositions d'économies</h2>
        </div>
        <ul className="mt-4 space-y-3">
          {data.savings_tips.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-slate-700"
            >
              <span className="mt-0.5 text-emerald-500">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
