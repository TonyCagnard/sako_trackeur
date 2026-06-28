import { useAuth } from "../context/AuthContext"

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "C$",
}

export default function Dashboard() {
  const { user } = useAuth()
  const symbol = CURRENCY_SYMBOL[user?.currency ?? "EUR"] ?? ""
  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—"

  const stats = [
    {
      label: "Solde actuel",
      value: `0,00 ${symbol}`,
      accent: "text-emerald-600",
      hint: "Vos dépenses et revenus apparaîtront ici",
    },
    {
      label: "Dépenses du mois",
      value: `0,00 ${symbol}`,
      accent: "text-rose-600",
      hint: "Disponible en partie 3",
    },
    {
      label: "Budgets actifs",
      value: "0",
      accent: "text-indigo-600",
      hint: "Définissez vos plafonds en partie 3",
    },
  ]

  return (
    <div className="space-y-8">
      {/* En-tête personnalisé */}
      <div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
          Espace personnel
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Bonjour {user?.first_name || user?.username} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Bienvenue dans ton espace Sako Trackeur — tes données sont privées et
          accessibles uniquement par toi.
        </p>
      </div>

      {/* Cartes stats (vides pour l'instant) */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${s.accent}`}>
              {s.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
          </div>
        ))}
      </section>

      {/* Récap compte */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Mon compte</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Identifiant</dt>
              <dd className="font-medium text-slate-800">{user?.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">E-mail</dt>
              <dd className="font-medium text-slate-800">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Devise</dt>
              <dd className="font-medium text-slate-800">{user?.currency}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Membre depuis</dt>
              <dd className="font-medium text-slate-800">{memberSince}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5">
          <h2 className="mb-2 font-semibold text-slate-900">Suite du programme</h2>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Partie 3 — Dépenses &amp; budgets (CRUD, catégories)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
              Partie 4 — Analytique &amp; graphiques
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-400">
            Chaque utilisateur ne voit que ses propres données.
          </p>
        </div>
      </section>
    </div>
  )
}
