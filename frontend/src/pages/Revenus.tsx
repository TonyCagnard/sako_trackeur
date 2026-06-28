import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
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

  const selectClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Revenus
          </h1>
          <p className="text-sm text-slate-500">
            Salaire, primes, remboursements — ajoute tes rentrées d'argent.
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2">
          <p className="text-xs text-emerald-700">Total des revenus</p>
          <p className="text-xl font-bold text-emerald-700">{fmt(total)}</p>
        </div>
      </div>

      {/* Formulaire */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Catégorie *
            </span>
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              required
              className={selectClass}
            >
              <option value="">Choisir…</option>
              {incomeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
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
          <h2 className="font-semibold text-slate-900">Historique des revenus</h2>
          <span className="text-xs text-slate-400">{revenus.length} revenu(s)</span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-slate-400">Chargement…</p>
        ) : revenus.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">
            Aucun revenu enregistré. Ajoute-en un ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {revenus.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: r.category_color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {r.category_name}
                      {r.description && (
                        <span className="font-normal text-slate-400">
                          {" — "}
                          {r.description}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">{fmtDate(r.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-600">
                    +{fmt(r.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(r)}
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
