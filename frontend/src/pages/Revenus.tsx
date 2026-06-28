import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
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

type Category = { id: number; name: string; kind: string; color: string }

type Revenue = {
  id: number
  category_name: string
  category_color: string
  amount: string
  date: string
  description: string
}

const todayStr = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

export default function Revenus() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [revenus, setRevenus] = useState<Revenue[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState({
    amount: "",
    category: "",
    date: todayStr(),
    description: "",
  })
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const incomeCats = categories.filter((c) => c.kind === "income")

  useEffect(() => {
    api
      .get<{ results: Category[] }>("/categories/")
      .then((res) => setCategories(res.data.results))
      .catch(() => {})
  }, [])

  useEffect(() => {
    api
      .get<Revenue[] | { results: Revenue[] }>("/expenses/", {
        params: { kind: "income", ordering: "-date" },
      })
      .then(({ data }) => setRevenus(Array.isArray(data) ? data : data.results))
      .catch(() => setRevenus([]))
      .finally(() => setLoading(false))
  }, [reloadKey])

  const fmt = (n: number | string) =>
    Number(n).toLocaleString("fr-FR", { style: "currency", currency })

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

  const total = revenus.reduce((s, r) => s + Number(r.amount), 0)

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    if (!form.category) return setError("Choisis une catégorie.")
    if (!form.amount || Number(form.amount) <= 0)
      return setError("Le montant doit être positif.")
    try {
      await api.post("/expenses/", {
        amount: form.amount,
        category: Number(form.category),
        date: form.date,
        description: form.description,
      })
      setForm((f) => ({ ...f, amount: "", description: "" }))
      setMsg("Revenu ajouté.")
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const remove = async (r: Revenue) => {
    if (!window.confirm(`Supprimer ce revenu (${fmt(r.amount)}) ?`)) return
    try {
      await api.delete(`/expenses/${r.id}/`)
      setReloadKey((k) => k + 1)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenus"
        description="Salaire, primes, remboursements — ajoute tes rentrées d'argent."
      >
        <div className="rounded-xl border border-positive/25 bg-positive/10 px-4 py-2 text-right">
          <p className="text-xs text-positive">Total des revenus</p>
          <p className="text-xl font-bold tnum text-positive">{fmt(total)}</p>
        </div>
      </PageHeader>

      {/* Formulaire */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-content">
          Ajouter un revenu
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
          <Field label="Catégorie *">
            <Select
              name="category"
              value={form.category}
              onChange={onChange}
              required
            >
              <option value="">Choisir…</option>
              {incomeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
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
            <Button type="submit">
              <Plus size={16} /> Ajouter
            </Button>
          </div>
        </form>
        {error && <Alert className="mt-4">{error}</Alert>}
        {msg && !error && <Alert tone="success" className="mt-4">{msg}</Alert>}
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader title="Historique des revenus">
          {revenus.length > 0 && (
            <span className="text-xs text-faint">{revenus.length} revenu(s)</span>
          )}
        </CardHeader>
        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner />
          </div>
        ) : revenus.length === 0 ? (
          <EmptyState
            title="Aucun revenu"
            description="Ajoute ton premier revenu ci-dessus pour suivre tes rentrées d'argent."
          />
        ) : (
          <ul className="divide-y divide-border">
            {revenus.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: r.category_color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-content">
                      {r.category_name}
                      {r.description && (
                        <span className="font-normal text-faint">
                          {" — "}
                          {r.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-faint">{fmtDate(r.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tnum text-positive">
                    +{fmt(r.amount)}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => remove(r)}
                    aria-label="Supprimer"
                    title="Supprimer"
                    className="h-8 w-8 p-0 text-faint hover:text-negative"
                  >
                    <Trash2 size={16} />
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
