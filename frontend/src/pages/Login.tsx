import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import type { AxiosError } from "axios"
import { useAuth } from "../context/AuthContext"
import AuthShell from "../components/AuthShell"
import { Alert, Button, TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? "/"

  const [form, setForm] = useState({ username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        extractApiError((err as AxiosError).response?.data) ||
          "Identifiants incorrects."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accède à ton espace Sako Trackeur"
      onSubmit={onSubmit}
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-medium text-accent hover:underline">
            Crée-en un
          </Link>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <TextField
        label="Nom d'utilisateur"
        name="username"
        value={form.username}
        onChange={onChange}
        autoComplete="username"
        autoFocus
        required
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        value={form.password}
        onChange={onChange}
        autoComplete="current-password"
        required
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Connexion…" : "Se connecter"}
      </Button>
    </AuthShell>
  )
}
