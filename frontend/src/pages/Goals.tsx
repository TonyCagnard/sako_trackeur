import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import { Trash2, Trophy } from "lucide-react"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  ProgressBar,
  Spinner,
  TextField,
} from "../components/ui"
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
      <PageHeader
        title="Objectifs"
        description="Épargne pour tes projets : définis une cible et ajoute de l'argent au fur et à mesure."
      />

      {/* Création */}
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-content">
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
                  className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted ring-1 ring-inset ring-border transition hover:text-content"
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
            <Button type="submit" className="w-full">
              Créer
            </Button>
          </div>
        </form>
        {error && <Alert className="mt-4">{error}</Alert>}
        {msg && !error && <Alert tone="success" className="mt-4">{msg}</Alert>}
      </Card>

      {/* Objectifs */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucun objectif"
            description="Crée ton premier objectif d'épargne ci-dessus."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-content">{g.name}</h3>
                  <p className="text-xs text-faint">Objectif {fmt(g.target_amount)}</p>
                </div>
                {g.is_reached ? (
                  <Badge tone="gold">
                    <Trophy size={13} /> Atteint
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => remove(g)}
                    aria-label="Supprimer"
                    title="Supprimer"
                    className="h-8 w-8 p-0 text-faint hover:text-negative"
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={g.progression}
                  tone={g.is_reached ? "gold" : "accent"}
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted">
                    <strong className="tnum text-content">
                      {fmt(g.current_amount)}
                    </strong>{" "}
                    / {fmt(g.target_amount)}
                  </span>
                  <span
                    className={`font-semibold tnum ${
                      g.is_reached ? "text-gold" : "text-accent"
                    }`}
                  >
                    {g.progression}%
                  </span>
                </div>
              </div>

              <p className="mt-2 text-sm text-muted">
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
                className="mt-4 flex items-center gap-2 border-t border-border pt-3"
              >
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={contributions[g.id] ?? ""}
                  onChange={(e) =>
                    setContributions((c) => ({ ...c, [g.id]: e.target.value }))
                  }
                  placeholder="Montant"
                  className="w-32"
                />
                <Button type="submit" variant="subtle">
                  Épargner
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
