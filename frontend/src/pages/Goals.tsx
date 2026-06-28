import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

type Goal = {
  id: number
  name: string
  target_amount: string
  current_amount: string
  progression: number
  is_reached: boolean
  remaining: number
  created_at: string
}

const PRESETS = ["Vacances", "Voiture", "PC", "Maison"]
const EMPTY = { name: "", target_amount: "", current_amount: "" }

export default function Goals() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(EMPTY)
  const [contributions, setContributions] = useState<Record<number, string>>({})
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    api
      .get<{ results: Goal[] }>("/goals/")
      .then((r) => setGoals(r.data.results))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const fmt = (n: number | string) =>
    Number(n).toLocaleString("fr-FR", { style: "currency", currency })

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    if (!form.name.trim()) return setError("Donne un nom à ton objectif.")
    if (!form.target_amount || Number(form.target_amount) <= 0)
      return setError("Le montant cible doit être positif.")
    try {
      await api.post("/goals/", {
        name: form.name.trim(),
        target_amount: form.target_amount,
        current_amount: form.current_amount || "0",
      })
      setForm(EMPTY)
      setMsg("Objectif créé.")
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const contribute = async (g: Goal) => {
    const amount = contributions[g.id]
    if (!amount || Number(amount) <= 0) return
    try {
      await api.post(`/goals/${g.id}/contribute/`, { amount })
      setContributions((c) => ({ ...c, [g.id]: "" }))
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const remove = async (g: Goal) => {
    if (!window.confirm(`Supprimer l'objectif « ${g.name} » ?`)) return
    try {
      await api.delete(`/goals/${g.id}/`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Objectifs
        </h1>
        <p className="text-sm text-slate-500">
          Épargne pour tes projets : définis une cible et ajoute de l'argent au
          fur et à mesure.
        </p>
      </div>

      {/* Formulaire de création */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Créer un objectif
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <TextField
              label="Nom *"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Vacances…"
              required
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, name: p }))}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <TextField
            label="Montant cible *"
            name="target_amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.target_amount}
            onChange={onChange}
            placeholder="2000"
            required
          />
          <TextField
            label="Déjà économisé"
            name="current_amount"
            type="number"
            min="0"
            step="0.01"
            value={form.current_amount}
            onChange={onChange}
            placeholder="0"
          />
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Créer
            </button>
          </div>
        </form>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        {msg && !error && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {msg}
          </p>
        )}
      </section>

      {/* Liste des objectifs */}
      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : goals.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Aucun objectif. Crée ton premier objectif ci-dessus.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const width = Math.min(g.progression, 100)
            return (
              <div
                key={g.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{g.name}</h3>
                    <p className="text-xs text-slate-400">
                      Objectif {fmt(g.target_amount)}
                    </p>
                  </div>
                  {g.is_reached ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      🎉 Atteint
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => remove(g)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        g.is_reached ? "bg-emerald-600" : "bg-emerald-500"
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      <strong>{fmt(g.current_amount)}</strong> / {fmt(g.target_amount)}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {g.progression}%
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  {g.is_reached
                    ? `Bravo, objectif dépassé de ${fmt(Math.abs(Number(g.remaining)))} !`
                    : `Reste ${fmt(g.remaining)} à économiser.`}
                </p>

                {/* Contribuer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    contribute(g)
                  }}
                  className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3"
                >
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={contributions[g.id] ?? ""}
                    onChange={(e) =>
                      setContributions((c) => ({ ...c, [g.id]: e.target.value }))
                    }
                    placeholder="Ajouter €"
                    className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                  >
                    Épargner
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
