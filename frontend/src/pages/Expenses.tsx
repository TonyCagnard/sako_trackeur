import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import { Plus, Trash2 } from "lucide-react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Spinner,
  TextField,
} from "../components/ui"
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

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [filters, setFilters] = useState({
    category: "",
    month: "",
    ordering: "-date",
  })
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const expenseCats = categories.filter((c) => c.kind === "expense")
  const incomeCats = categories.filter((c) => c.kind === "income")

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

  useEffect(() => {
    api
      .get<{ results: Category[] }>("/categories/")
      .then((res) => setCategories(res.data.results))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(t)
  }, [searchInput])

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

  const onFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépenses"
        description="Recherche, filtre par catégorie et par mois, tri — et édition complète."
      />

      {/* Barre de filtres */}
      <Card className="p-4">
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
          <Field label="Catégorie">
            <Select name="category" value={filters.category} onChange={onFilterChange}>
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
            </Select>
          </Field>
          <Field label="Mois">
            <Select name="month" value={filters.month} onChange={onFilterChange}>
              <option value="">Tous les mois</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tri">
            <Select name="ordering" value={filters.ordering} onChange={onFilterChange}>
              <option value="-date">Date (récent → ancien)</option>
              <option value="date">Date (ancien → récent)</option>
              <option value="-amount">Montant (élevé → bas)</option>
              <option value="amount">Montant (bas → élevé)</option>
            </Select>
          </Field>
          <Button type="button" variant="subtle" onClick={clearFilters}>
            Réinitialiser
          </Button>
        </div>
      </Card>

      {/* Formulaire ajout / édition */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-content">
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
          <Field label="Catégorie *">
            <Select
              name="category"
              value={form.category}
              onChange={onFormChange}
              required
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
            </Select>
          </Field>
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
            <Button type="submit">
              <Plus size={16} /> {editingId ? "Enregistrer" : "Ajouter"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Annuler
              </Button>
            )}
          </div>
        </form>
        {error && <Alert className="mt-4">{error}</Alert>}
        {msg && !error && <Alert tone="success" className="mt-4">{msg}</Alert>}
      </Card>

      {/* Liste */}
      <Card>
        <CardHeader title="Historique">
          {expenses.length > 0 && (
            <span className="text-xs text-faint">{expenses.length} résultat(s)</span>
          )}
        </CardHeader>
        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="Aucune dépense"
            description="Aucune dépense ne correspond à tes filtres, ou tu n'en as encore aucune."
          />
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((exp) => (
              <li
                key={exp.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: exp.category_color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">
                      {exp.category_name}
                      {exp.description && (
                        <span className="font-normal text-faint">
                          {" — "}
                          {exp.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-faint">{fmtDate(exp.date)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={`mr-2 text-sm font-semibold tnum ${
                      exp.kind === "income" ? "text-positive" : "text-content"
                    }`}
                  >
                    {exp.kind === "income" ? "+" : "−"}
                    {fmt(exp.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => startEdit(exp)}
                    className="px-2.5 py-1 text-xs"
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove(exp)}
                    aria-label="Supprimer"
                    title="Supprimer"
                    className="h-8 w-8 p-0 text-faint hover:text-negative"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
