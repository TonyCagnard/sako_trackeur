import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import { AlertTriangle, Pencil, Trash2 } from "lucide-react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  ProgressBar,
  Select,
  Spinner,
  TextField,
} from "../components/ui"
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

  const budgetedIds = new Set(budgets.map((b) => b.category))
  const availableCats = categories.filter(
    (c) =>
      c.kind === "expense" && (!budgetedIds.has(c.id) || c.id === Number(form.category))
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

  const tone = (b: Budget) =>
    b.is_over ? "danger" : b.percentage >= 80 ? "gold" : "accent"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Fixe un plafond mensuel par catégorie et suis ta consommation en temps réel."
      />

      {/* Formulaire */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-content">
          {editingId ? "Modifier le budget" : "Définir un budget"}
        </h2>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Field label="Catégorie">
              <Select
                name="category"
                value={form.category}
                onChange={onChange}
                disabled={!!editingId}
                required
              >
                <option value="">Choisir…</option>
                {availableCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
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
          <Button type="submit">{editingId ? "Enregistrer" : "Définir"}</Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={reset}>
              Annuler
            </Button>
          )}
        </form>
        {error && <Alert className="mt-4">{error}</Alert>}
        {msg && !error && <Alert tone="success" className="mt-4">{msg}</Alert>}
      </Card>

      {/* Budgets */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun budget"
            description="Définis ton premier budget ci-dessus pour suivre tes dépenses par catégorie."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: b.category_color }}
                  />
                  <span className="font-semibold text-content">
                    {b.category_name}
                  </span>
                </div>
                <span className="text-xs text-faint">
                  Budget {fmt(b.amount)} / mois
                </span>
              </div>

              <div className="mt-4">
                <ProgressBar value={b.percentage} tone={tone(b)} />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Dépensé <strong className="tnum text-content">{fmt(b.spent)}</strong>
                  </span>
                  <span
                    className={`font-semibold tnum ${
                      b.is_over ? "text-negative" : "text-content"
                    }`}
                  >
                    {b.percentage}%
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm">
                {b.is_over ? (
                  <span className="font-medium text-negative">
                    Dépassé de {fmt(Math.abs(Number(b.remaining)))}
                  </span>
                ) : (
                  <span className="text-muted">
                    Restant{" "}
                    <strong className="font-semibold text-positive tnum">
                      {fmt(b.remaining)}
                    </strong>
                  </span>
                )}
              </p>

              {b.is_over && (
                <Alert className="mt-3" tone="error">
                  <span className="flex items-start gap-2">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <span>
                      Budget dépassé ce mois-ci. Pense à réduire tes dépenses en{" "}
                      {b.category_name.toLowerCase()}.
                    </span>
                  </span>
                </Alert>
              )}

              <div className="mt-4 flex gap-2 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  onClick={() => startEdit(b)}
                  className="px-2.5 py-1 text-xs"
                >
                  <Pencil size={13} /> Modifier
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => remove(b)}
                  aria-label="Supprimer"
                  title="Supprimer"
                  className="h-8 w-8 p-0 text-faint hover:text-negative"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
