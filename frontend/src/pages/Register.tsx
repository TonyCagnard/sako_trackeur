import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { AxiosError } from "axios"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

const EMPTY = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  password: "",
  password2: "",
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.password2) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setLoading(true)
    try {
      await register(form)
      navigate("/", { replace: true })
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white shadow-sm">
            S
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Créer un compte
          </h1>
          <p className="text-sm text-slate-500">
            Quelques secondes pour rejoindre Sako Trackeur
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          <TextField
            label="Nom d'utilisateur *"
            name="username"
            value={form.username}
            onChange={onChange}
            autoComplete="username"
            required
          />
          <TextField
            label="E-mail *"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Prénom"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
              autoComplete="given-name"
            />
            <TextField
              label="Nom"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
              autoComplete="family-name"
            />
          </div>
          <TextField
            label="Téléphone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
          />
          <TextField
            label="Mot de passe *"
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
          <TextField
            label="Confirmer le mot de passe *"
            name="password2"
            type="password"
            value={form.password2}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Déjà inscrit ?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Connecte-toi
          </Link>
        </p>
      </div>
    </div>
  )
}
