import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
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

const EMPTY_FORM = { amount: "", category: "", date: todayStr(), description: "" }

export default function Expenses() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filters, setFilters] = useState({
    category: "",
    month: "",
    ordering: "-date",
  })
  const [reloadKey, setReloadKey] = useState(0)

  // Formulaire (ajout / édition)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const expenseCats = categories.filter((c) => c.kind === "expense")
  const incomeCats = categories.filter((c) => c.kind === "income")

  // Liste des 12 derniers mois pour le filtre
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1)
      opts.push({
        value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`,
        label: m.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      })
    }
    return opts
  }, [])

  // Catégories (pour le select) — une fois
  useEffect(() => {
    api
      .get<{ results: Category[] }>("/categories/")
      .then((res) => setCategories(res.data.results))
      .catch(() => {})
  }, [])

  // Débounce de la recherche
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Rechargement des dépenses selon les filtres
  useEffect(() => {
    const params: Record<string, string> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.category) params.category = filters.category
    if (filters.month) {
      const [y, mo] = filters.month.split("-")
      params.year = y
      params.month = mo
    }
    if (filters.ordering) params.ordering = filters.ordering
    api
      .get<Expense[] | { results: Expense[] }>("/expenses/", { params })
      .then(({ data }) => setExpenses(Array.isArray(data) ? data : data.results))
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false))
  }, [debouncedSearch, filters.category, filters.month, filters.ordering, reloadKey])

  const fmt = (amount: string) =>
    Number(amount).toLocaleString("fr-FR", { style: "currency", currency })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const onFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }))

  const clearFilters = () => {
    setSearchInput("")
    setFilters({ category: "", month: "", ordering: "-date" })
  }

  const onFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const resetForm = () => {
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
    if (!form.date) return setError("Choisis une date valide.")
    const payload = {
      amount: form.amount,
      category: Number(form.category),
      date: form.date,
      description: form.description,
    }
    try {
      if (editingId) {
        await api.patch(`/expenses/${editingId}/`, payload)
        setMsg("Dépense modifiée.")
      } else {
        await api.post("/expenses/", payload)
        setMsg("Dépense ajoutée.")
      }
      resetForm()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const startEdit = (exp: Expense) => {
    setForm({
      amount: exp.amount,
      category: String(exp.category),
      date: exp.date,
      description: exp.description,
    })
    setEditingId(exp.id)
    setError("")
    setMsg("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const remove = async (exp: Expense) => {
    if (!window.confirm(`Supprimer cette dépense (${fmt(exp.amount)}) ?`)) return
    try {
      await api.delete(`/expenses/${exp.id}/`)
      if (editingId === exp.id) resetForm()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dépenses</h1>
        <p className="text-sm text-slate-500">
          Recherche, filtre par catégorie et par mois, tri — et édition complète.
        </p>
      </div>

      {/* Barre de filtres */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <TextField
              label="Recherche"
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Description…"
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Catégorie</span>
            <select
              name="category"
              value={filters.category}
              onChange={onFilterChange}
              className={selectClass}
            >
              <option value="">Toutes</option>
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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Mois</span>
            <select
              name="month"
              value={filters.month}
              onChange={onFilterChange}
              className={selectClass}
            >
              <option value="">Tous les mois</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Tri</span>
            <select
              name="ordering"
              value={filters.ordering}
              onChange={onFilterChange}
              className={selectClass}
            >
              <option value="-date">Date (récent → ancien)</option>
              <option value="date">Date (ancien → récent)</option>
              <option value="-amount">Montant (élevé → bas)</option>
              <option value="amount">Montant (bas → élevé)</option>
            </select>
          </label>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-100"
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {/* Formulaire ajout / édition */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editingId ? "Modifier la dépense" : "Ajouter une dépense"}
        </h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Montant *"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={onFormChange}
            placeholder="0,00"
            required
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Catégorie *</span>
            <select
              name="category"
              value={form.category}
              onChange={onFormChange}
              required
              className={`${selectClass} w-full`}
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
            onChange={onFormChange}
            required
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={onFormChange}
            placeholder="Optionnel"
          />
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Annuler
              </button>
            )}
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
          <span className="text-xs text-slate-400">
            {expenses.length} résultat(s)
          </span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Chargement…</p>
        ) : expenses.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            Aucune dépense ne correspond à tes filtres.
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
                <div className="flex items-center gap-2">
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
                    onClick={() => startEdit(exp)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Modifier
                  </button>
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
