import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import { Trash2 } from "lucide-react"
import api from "../api/client"
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  Spinner,
  TextField,
} from "../components/ui"
import { extractApiError } from "../lib/apiError"

type Kind = "expense" | "income"

type Category = {
  id: number
  name: string
  kind: Kind
  color: string
  created_at: string
}

const EMPTY = { name: "", kind: "expense" as Kind, color: "#10b981" }

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
        setCategories((cs) => cs.map((c) => (c.id === editingId ? data : c)))
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
      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: c.color }}
        />
        <span className="truncate text-sm font-medium text-content">{c.name}</span>
        <Badge tone={c.kind === "income" ? "positive" : "default"}>
          {KIND_LABEL[c.kind]}
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => startEdit(c)}
          className="px-2.5 py-1 text-xs"
        >
          Modifier
        </Button>
        <Button
          variant="ghost"
          onClick={() => remove(c)}
          aria-label="Supprimer"
          title="Supprimer"
          className="h-8 w-8 p-0 text-faint hover:text-negative"
        >
          <Trash2 size={15} />
        </Button>
      </div>
    </li>
  )

  const expenses = categories.filter((c) => c.kind === "expense")
  const incomes = categories.filter((c) => c.kind === "income")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catégories"
        description="Organise tes dépenses et revenus. Les catégories par défaut sont déjà créées — ajoute, modifie ou supprime comme tu veux."
      />

      {/* Formulaire ajout / édition */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-content">
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
          <Field label="Type">
            <Select name="kind" value={form.kind} onChange={onChange}>
              <option value="expense">Dépense</option>
              <option value="income">Revenu</option>
            </Select>
          </Field>
          <Field label="Couleur">
            <input
              type="color"
              name="color"
              value={form.color}
              onChange={onChange}
              className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-canvas p-1"
            />
          </Field>
          <Button type="submit">{editingId ? "Enregistrer" : "Ajouter"}</Button>
          {editingId && (
            <Button type="button" variant="ghost" onClick={reset}>
              Annuler
            </Button>
          )}
        </form>
        {error && <Alert className="mt-4">{error}</Alert>}
        {msg && !error && <Alert tone="success" className="mt-4">{msg}</Alert>}
      </Card>

      {/* Listes */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState title="Aucune catégorie" description="Crée ta première catégorie ci-dessus." />
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <section>
            <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-faint">
              Dépenses ({expenses.length})
            </h2>
            <ul className="space-y-2">{expenses.map(renderRow)}</ul>
          </section>
          <section>
            <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-faint">
              Revenus ({incomes.length})
            </h2>
            <ul className="space-y-2">{incomes.map(renderRow)}</ul>
          </section>
        </div>
      )}
    </div>
  )
}
