import { useState, type ChangeEvent, type FormEvent } from "react"
import type { AxiosError } from "axios"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Field,
  PageHeader,
  Select,
  TextField,
} from "../components/ui"
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
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Gère tes informations personnelles et ton mot de passe."
      />

      {/* Informations */}
      <Card>
        <CardHeader title="Informations" description="Ton identité et tes préférences." />
        <form onSubmit={submitProfile} className="space-y-4 p-5">
          {profileErr && <Alert>{profileErr}</Alert>}
          {profileStatus?.ok && <Alert tone="success">{profileStatus.text}</Alert>}
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
          <TextField
            label="Téléphone"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="+33 6 12 34 56 78"
          />
          <Field label="Devise">
            <Select name="currency" value={form.currency} onChange={onChange}>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="USD">USD — Dollar US ($)</option>
              <option value="GBP">GBP — Livre sterling (£)</option>
              <option value="CHF">CHF — Franc suisse</option>
              <option value="CAD">CAD — Dollar canadien</option>
            </Select>
          </Field>
          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <span className="text-xs text-faint">Identifiant : {user?.username}</span>
          </div>
        </form>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader title="Sécurité" description="Change ton mot de passe." />
        <form onSubmit={submitPwd} className="space-y-4 p-5">
          {pwdErr && <Alert>{pwdErr}</Alert>}
          {pwdStatus?.ok && <Alert tone="success">{pwdStatus.text}</Alert>}
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
          <Button type="submit" variant="subtle" disabled={savingPwd}>
            {savingPwd ? "Modification…" : "Changer le mot de passe"}
          </Button>
        </form>
      </Card>
    </div>
  )
}
