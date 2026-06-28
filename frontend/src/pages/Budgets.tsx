import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

type Category = {
  id: number
  name: string
  kind: "expense" | "income"
  color: string
}

type Budget = {
  id: number
  category: number
  category_name: string
  category_color: string
  amount: string
  spent: number
  remaining: number
  percentage: number
  is_over: boolean
  created_at: string
}

const EMPTY_FORM = { category: "", amount: "" }

export default function Budgets() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    api
      .get<{ results: Category[] }>("/categories/")
      .then((res) => setCategories(res.data.results))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api
      .get<{ results: Budget[] }>("/budgets/")
      .then((res) => setBudgets(res.data.results))
      .catch(() => setBudgets([]))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const fmt = (n: number | string) =>
    Number(n).toLocaleString("fr-FR", { style: "currency", currency })

  // Catégories disponibles = dépenses sans budget (sauf celle en cours d'édition)
  const budgetedIds = new Set(budgets.map((b) => b.category))
  const availableCats = categories.filter(
    (c) => c.kind === "expense" && (!budgetedIds.has(c.id) || c.id === Number(form.category))
  )

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const reset = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
    setMsg("")
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    if (!form.category) return setError("Choisis une catégorie.")
    if (!form.amount || Number(form.amount) <= 0)
      return setError("Le montant doit être positif.")
    try {
      if (editingId) {
        await api.patch(`/budgets/${editingId}/`, {
          category: Number(form.category),
          amount: form.amount,
        })
        setMsg("Budget modifié.")
      } else {
        await api.post("/budgets/", {
          category: Number(form.category),
          amount: form.amount,
        })
        setMsg("Budget défini.")
      }
      reset()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const startEdit = (b: Budget) => {
    setForm({ category: String(b.category), amount: b.amount })
    setEditingId(b.id)
    setError("")
    setMsg("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (b: Budget) => {
    if (!window.confirm(`Supprimer le budget « ${b.category_name} » ?`)) return
    try {
      await api.delete(`/budgets/${b.id}/`)
      if (editingId === b.id) reset()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const barColor = (b: Budget) =>
    b.is_over
      ? "bg-rose-500"
      : b.percentage >= 80
        ? "bg-amber-500"
        : "bg-indigo-500"

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budgets</h1>
        <p className="text-sm text-slate-500">
          Fixe un plafond mensuel par catégorie et suis ta consommation en temps réel.
        </p>
      </div>

      {/* Formulaire */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editingId ? "Modifier le budget" : "Définir un budget"}
        </h2>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Catégorie
              </span>
              <select
                name="category"
                value={form.category}
                onChange={onChange}
                disabled={!!editingId}
                required
                className={selectClass}
              >
                <option value="">Choisir…</option>
                {availableCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="w-40">
            <TextField
              label="Montant / mois *"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={onChange}
              placeholder="0,00"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            {editingId ? "Enregistrer" : "Définir"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Annuler
            </button>
          )}
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

      {/* Liste des budgets avec barres de progression */}
      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : budgets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-400">
          Aucun budget pour l'instant. Définis ton premier budget ci-dessus.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((b) => {
            const width = Math.min(b.percentage, 100)
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: b.category_color }}
                    />
                    <span className="font-semibold text-slate-800">
                      {b.category_name}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">
                    Budget {fmt(b.amount)} / mois
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mt-4">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${barColor(b)}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Dépensé <strong>{fmt(b.spent)}</strong>
                    </span>
                    <span
                      className={`font-semibold ${
                        b.is_over ? "text-rose-600" : "text-slate-700"
                      }`}
                    >
                      {b.percentage}%
                    </span>
                  </div>
                </div>

                {/* Restant / dépassé */}
                <p className="mt-2 text-sm">
                  {b.is_over ? (
                    <span className="font-medium text-rose-600">
                      Dépassé de {fmt(Math.abs(Number(b.remaining)))}
                    </span>
                  ) : (
                    <span className="text-slate-600">
                      Restant{" "}
                      <strong className="text-emerald-600">{fmt(b.remaining)}</strong>
                    </span>
                  )}
                </p>

                {/* Alerte dépassement */}
                {b.is_over && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    ⚠️ Budget dépassé ce mois-ci. Pense à réduire tes dépenses en{" "}
                    {b.category_name.toLowerCase()}.
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="rounded-md px-2.5 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(b)}
                    className="rounded-md px-2.5 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
