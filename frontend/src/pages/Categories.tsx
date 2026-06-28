import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { extractApiError } from "../lib/apiError"
import { TextField } from "../components/ui"

type Kind = "expense" | "income"

type Category = {
  id: number
  name: string
  kind: Kind
  color: string
  created_at: string
}

const EMPTY = { name: "", kind: "expense" as Kind, color: "#6366f1" }

const KIND_LABEL: Record<Kind, string> = {
  expense: "Dépense",
  income: "Revenu",
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  useEffect(() => {
    api
      .get<{ results: Category[] }>("/categories/")
      .then((res) => setCategories(res.data.results))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [])

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const reset = () => {
    setForm(EMPTY)
    setEditingId(null)
    setError("")
    setMsg("")
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setMsg("")
    try {
      if (editingId) {
        const { data } = await api.patch<Category>(`/categories/${editingId}/`, form)
        setCategories((cs) =>
          cs.map((c) => (c.id === editingId ? data : c))
        )
        setMsg("Catégorie modifiée.")
      } else {
        const { data } = await api.post<Category>("/categories/", form)
        setCategories((cs) =>
          [...cs, data].sort((a, b) => a.name.localeCompare(b.name))
        )
        setMsg("Catégorie ajoutée.")
      }
      reset()
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const startEdit = (c: Category) => {
    setForm({ name: c.name, kind: c.kind, color: c.color })
    setEditingId(c.id)
    setError("")
    setMsg("")
  }

  const remove = async (c: Category) => {
    if (!window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) return
    try {
      await api.delete(`/categories/${c.id}/`)
      setCategories((cs) => cs.filter((x) => x.id !== c.id))
      if (editingId === c.id) reset()
      setMsg(`« ${c.name} » supprimée.`)
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    }
  }

  const renderRow = (c: Category) => (
    <li
      key={c.id}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-4 w-4 rounded-full ring-2 ring-white"
          style={{ backgroundColor: c.color }}
        />
        <span className="font-medium text-slate-800">{c.name}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {KIND_LABEL[c.kind]}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => startEdit(c)}
          className="rounded-md px-2.5 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Modifier
        </button>
        <button
          type="button"
          onClick={() => remove(c)}
          className="rounded-md px-2.5 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50"
        >
          Supprimer
        </button>
      </div>
    </li>
  )

  const expenses = categories.filter((c) => c.kind === "expense")
  const incomes = categories.filter((c) => c.kind === "income")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Catégories
        </h1>
        <p className="text-sm text-slate-500">
          Organise tes dépenses et revenus. Les 9 catégories par défaut sont déjà
          créées — ajoute, modifie ou supprime comme tu veux.
        </p>
      </div>

      {/* Formulaire ajout / édition */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editingId ? "Modifier la catégorie" : "Ajouter une catégorie"}
        </h2>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <TextField
              label="Nom"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Ex : Vacances"
              required
            />
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Type</span>
            <select
              name="kind"
              value={form.kind}
              onChange={onChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Couleur</span>
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={onChange}
              className="h-[42px] w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            {editingId ? "Enregistrer" : "Ajouter"}
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

      {/* Listes */}
      {loading ? (
        <p className="text-sm text-slate-400">Chargement…</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Dépenses ({expenses.length})
            </h2>
            <ul className="space-y-2">{expenses.map(renderRow)}</ul>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Revenus ({incomes.length})
            </h2>
            <ul className="space-y-2">{incomes.map(renderRow)}</ul>
          </section>
        </div>
      )}
    </div>
  )
}
