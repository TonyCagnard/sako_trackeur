import { useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { TextField } from "../components/ui"
import { extractApiError } from "../lib/apiError"

type Status = { ok: boolean; text: string }

export default function Profile() {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
    currency: user?.currency ?? "EUR",
  })
  const [profileStatus, setProfileStatus] = useState<Status | null>(null)
  const [profileErr, setProfileErr] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwd, setPwd] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  })
  const [pwdStatus, setPwdStatus] = useState<Status | null>(null)
  const [pwdErr, setPwdErr] = useState("")
  const [savingPwd, setSavingPwd] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const onPwdChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPwd((p) => ({ ...p, [e.target.name]: e.target.value }))

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileErr("")
    setProfileStatus(null)
    setSavingProfile(true)
    try {
      const { data } = await api.patch("/auth/me/", form)
      updateUser(data)
      setProfileStatus({ ok: true, text: "Profil mis à jour." })
    } catch (err) {
      setProfileErr(extractApiError((err as AxiosError).response?.data))
    } finally {
      setSavingProfile(false)
    }
  }

  const submitPwd = async (e: FormEvent) => {
    e.preventDefault()
    setPwdErr("")
    setPwdStatus(null)
    if (pwd.new_password !== pwd.new_password2) {
      setPwdErr("Les nouveaux mots de passe ne correspondent pas.")
      return
    }
    setSavingPwd(true)
    try {
      await api.post("/auth/change-password/", {
        old_password: pwd.old_password,
        new_password: pwd.new_password,
      })
      setPwdStatus({ ok: true, text: "Mot de passe modifié avec succès." })
      setPwd({ old_password: "", new_password: "", new_password2: "" })
    } catch (err) {
      setPwdErr(extractApiError((err as AxiosError).response?.data))
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mon profil</h1>
        <p className="text-sm text-slate-500">
          Gère tes informations personnelles et ton mot de passe.
        </p>
      </div>

      {/* Informations */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Informations</h2>
        <form onSubmit={submitProfile} className="space-y-4">
          {profileErr && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {profileErr}
            </div>
          )}
          {profileStatus?.ok && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {profileStatus.text}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Prénom"
              name="first_name"
              value={form.first_name}
              onChange={onChange}
            />
            <TextField
              label="Nom"
              name="last_name"
              value={form.last_name}
              onChange={onChange}
            />
          </div>
          <TextField label="Téléphone" name="phone" value={form.phone} onChange={onChange} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Devise</span>
            <select
              name="currency"
              value={form.currency}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="EUR">EUR — Euro (€)</option>
              <option value="USD">USD — Dollar US ($)</option>
              <option value="GBP">GBP — Livre sterling (£)</option>
              <option value="CHF">CHF — Franc suisse</option>
              <option value="CAD">CAD — Dollar canadien</option>
            </select>
          </label>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? "Enregistrement…" : "Enregistrer"}
            </button>
            <span className="text-xs text-slate-400">
              Identifiant : {user?.username}
            </span>
          </div>
        </form>
      </section>

      {/* Mot de passe */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Sécurité</h2>
        <form onSubmit={submitPwd} className="space-y-4">
          {pwdErr && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {pwdErr}
            </div>
          )}
          {pwdStatus?.ok && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {pwdStatus.text}
            </div>
          )}
          <TextField
            label="Mot de passe actuel"
            name="old_password"
            type="password"
            value={pwd.old_password}
            onChange={onPwdChange}
            autoComplete="current-password"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Nouveau mot de passe"
              name="new_password"
              type="password"
              value={pwd.new_password}
              onChange={onPwdChange}
              autoComplete="new-password"
              required
            />
            <TextField
              label="Confirmer"
              name="new_password2"
              type="password"
              value={pwd.new_password2}
              onChange={onPwdChange}
              autoComplete="new-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={savingPwd}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPwd ? "Modification…" : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  )
}
