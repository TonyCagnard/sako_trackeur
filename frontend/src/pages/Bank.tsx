import { useEffect, useState } from "react"
import type { AxiosError } from "axios"
import { Link } from "react-router-dom"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"
import { extractApiError } from "../lib/apiError"

type BankAccount = {
  name: string
  iban_masked: string
  balance: string
  currency: string
}

type BankConnection = {
  id: number
  provider: string
  status: string
  last_synced_at: string | null
  accounts: BankAccount[]
  imported_count: number
}

const PROVIDER_LABEL: Record<string, string> = {
  mock: "Sandbox (démo)",
  gocardless: "GoCardless",
  bridge: "Bridge",
}

export default function Bank() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [provider, setProvider] = useState("mock")
  const [error, setError] = useState("")
  const [msg, setMsg] = useState("")

  const load = () =>
    api
      .get<{ connections: BankConnection[] }>("/banking/")
      .then((r) => setConnections(r.data.connections))
      .catch(() => setConnections([]))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const fmt = (n: string) =>
    Number(n).toLocaleString("fr-FR", { style: "currency", currency })

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "jamais"

  const connect = async () => {
    setBusy(true)
    setError("")
    setMsg("")
    try {
      const { data } = await api.post("/banking/connect/", { provider })
      setMsg(
        `${data.imported} transaction(s) importée(s) et catégorisée(s) automatiquement.`
      )
      load()
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    } finally {
      setBusy(false)
    }
  }

  const sync = async () => {
    setBusy(true)
    setError("")
    setMsg("")
    try {
      const { data } = await api.post("/banking/sync/")
      setMsg(
        data.imported > 0
          ? `${data.imported} nouvelle(s) transaction(s) importée(s).`
          : "À jour : aucune nouvelle transaction."
      )
      load()
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async (c: BankConnection) => {
    const confirmMsg =
      c.imported_count > 0
        ? `Déconnecter cette banque ? Cela supprimera aussi les ${c.imported_count} transaction(s) importée(s).`
        : "Déconnecter cette banque ?"
    if (!window.confirm(confirmMsg)) return
    setBusy(true)
    setError("")
    setMsg("")
    try {
      const { data } = await api.delete(`/banking/${c.id}/`)
      setMsg(data.detail || "Banque déconnectée.")
      load()
    } catch (err) {
      setError(extractApiError((err as AxiosError).response?.data))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Banque</h1>
        <p className="text-sm text-slate-500">
          Connecte ta banque pour importer et catégoriser tes transactions
          automatiquement.
        </p>
      </div>

      {/* Note sandbox */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Mode sandbox actif</p>
        <p className="mt-1">
          Par défaut, le provider « mock » simule une banque avec des données de
          démonstration. Pour une vraie banque, ajoute tes identifiants{" "}
          <strong>Bridge</strong> ou <strong>GoCardless</strong> dans{" "}
          <code className="rounded bg-amber-100 px-1">backend/.env</code> puis
          reconnecte-toi avec le provider correspondant.
        </p>
      </div>

      {/* Connexion */}
      {connections.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-600">Aucune banque connectée pour l'instant.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="mock">Sandbox (démo)</option>
              <option value="bridge">Bridge</option>
              <option value="gocardless">GoCardless</option>
            </select>
            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Connexion…" : "Connecter ma banque"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={sync}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? "Synchronisation…" : "↻ Synchroniser maintenant"}
            </button>
          </div>

          {connections.map((c) => (
            <section
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {PROVIDER_LABEL[c.provider] || c.provider}
                  </span>
                  <p className="mt-2 text-xs text-slate-400">
                    {c.imported_count} transaction(s) importée(s) · dernière synchro :{" "}
                    {fmtDate(c.last_synced_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => disconnect(c)}
                  disabled={busy}
                  className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-inset ring-rose-300 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Déconnecter
                </button>
              </div>

              <div className="space-y-2">
                {c.accounts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{a.name}</p>
                      <p className="font-mono text-xs text-slate-400">{a.iban_masked}</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{fmt(a.balance)}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="text-sm text-slate-500">
            Les transactions importées apparaissent dans{" "}
            <Link to="/expenses" className="font-medium text-indigo-600 hover:underline">
              Dépenses
            </Link>{" "}
            et sont catégorisées automatiquement (Carrefour → Courses, etc.).
          </p>
        </>
      )}

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {msg && !error && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {msg}
        </p>
      )}

      {loading && <p className="text-sm text-slate-400">Chargement…</p>}
    </div>
  )
}
