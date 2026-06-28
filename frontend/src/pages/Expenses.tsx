import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

type Kind = "expense" | "income"

type Category = { id: number; name: string; kind: Kind; color: string }

type Expense = {
  id: number
  category: number
  category_name: string
  category_color: string
  kind: Kind
  amount: string
  date: string
  description: string
  created_at: string
}

const todayStr = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

export default function Expenses() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: todayStr(),
    description: "",
  })
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    Promise.all([
      api.get<{ results: Expense[] }>("/expenses/"),
      api.get<{ results: Category[] }>("/categories/"),
    ])
      .then(([exp, cat]) => {
        setExpenses(exp.data.results)
        setCategories(cat.data.results)
      })
      .catch(() => {
        /* token invalide géré par l'intercepteur */
      })
      .finally(() => setLoading(false))
  }, [])

  const expenseCats = categories.filter((c) => c.kind === "expense")
  const incomeCats = categories.filter((c) => c.kind === "income")

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const fmt = (amount: string) =>
    Number(amount).toLocaleString("fr-FR", {
      style: "currency",
      currency,
    })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    if (!form.category) {
      setError("Choisis une catégorie.")
      return
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Le montant doit être positif.")
      return
    }
    if (!form.date) {
      setError("Choisis une date valide.")
      return
    }
    try {
      const { data } = await api.post<Expense>("/expenses/", {
        amount: form.amount,
        category: Number(form.category),
        date: form.date,
        description: form.description,
      })
      setExpenses((es) => [data, ...es])
      // On garde la catégorie et la date (saisie rapide), on vide le reste
      setForm((f) => ({ ...f, amount: "", description: "" }))
      setMsg("Dépense ajoutée.")
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const remove = async (exp: Expense) => {
    if (!window.confirm(`Supprimer cette dépense (${fmt(exp.amount)}) ?`)) return
    try {
      await api.delete(`/expenses/${exp.id}/`)
      setExpenses((es) => es.filter((x) => x.id !== exp.id))
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Dépenses
        </h1>
        <p className="text-sm text-slate-500">
          Ajoute tes dépenses et revenus. Chaque enregistrement est rattaché à une
          catégorie.
        </p>
      </div>

      {/* Formulaire d'ajout */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Ajouter une dépense
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Montant *"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={onChange}
            placeholder="0,00"
            required
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Catégorie *
            </span>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Choisir…</option>
              <optgroup label="Dépenses">
                {expenseCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Revenus">
                {incomeCats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <TextField
            label="Date *"
            name="date"
            type="date"
            value={form.date}
            onChange={onChange}
            required
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Optionnel"
          />
          <div className="flex items-end sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Ajouter
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

      {/* Liste */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Historique</h2>
          <span className="text-xs text-slate-400">{expenses.length} enregistrement(s)</span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Chargement…</p>
        ) : expenses.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            Aucune dépense pour l'instant. Ajoute la première ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: exp.category_color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {exp.category_name}
                      {exp.description && (
                        <span className="font-normal text-slate-400">
                          {" — "}
                          {exp.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{fmtDate(exp.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      exp.kind === "income" ? "text-emerald-600" : "text-slate-800"
                    }`}
                  >
                    {exp.kind === "income" ? "+" : "−"}
                    {fmt(exp.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(exp)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
