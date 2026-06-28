import { useEffect, useState } from 'react'
import axios from 'axios'

type ApiStatus = 'checking' | 'online' | 'offline'

// Données d'aperçu (mock) — remplacées par les vraies données de l'API
// lors des prochaines phases (expenses / budgets / analytics).
const STATS = [
  { label: 'Solde actuel', value: '2 480,75 €', accent: 'text-emerald-600', hint: '+4,2 % ce mois' },
  { label: 'Dépenses (mois)', value: '1 236,40 €', accent: 'text-rose-600', hint: 'sur 1 500 € budgétés' },
  { label: 'Budget restant', value: '263,60 €', accent: 'text-indigo-600', hint: '17 jours restants' },
]

const TRANSACTIONS = [
  { label: 'Carrefour — Courses', category: 'Alimentation', amount: '-87,30 €', positive: false, when: "Aujourd'hui" },
  { label: 'Salaire', category: 'Revenus', amount: '+2 540,00 €', positive: true, when: 'Hier' },
  { label: 'Netflix', category: 'Abonnement', amount: '-13,49 €', positive: false, when: '12 juin' },
  { label: 'Total — Essence', category: 'Transport', amount: '-52,10 €', positive: false, when: '11 juin' },
]

function StatusPill({ status }: { status: ApiStatus }) {
  const map = {
    checking: { dot: 'bg-amber-400', text: 'Vérification de l’API…', chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
    online: { dot: 'bg-emerald-500', text: 'API connectée', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    offline: { dot: 'bg-rose-500', text: 'Backend hors-ligne', chip: 'bg-rose-50 text-rose-700 ring-rose-200' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${map.chip}`}>
      <span className={`h-2 w-2 rounded-full ${map.dot} ${status === 'checking' ? 'animate-pulse' : ''}`} />
      {map.text}
    </span>
  )
}

function App() {
  const [status, setStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    const controller = new AbortController()
    axios
      .get('/api/health/', { signal: controller.signal })
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
    return () => controller.abort()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Barre supérieure */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <span className="text-lg font-bold">S</span>
            </div>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">Sako Trackeur</p>
              <p className="text-xs text-slate-500">Budget personnel</p>
            </div>
          </div>
          <StatusPill status={status} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Hero */}
        <section className="mb-10">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
            Phase 1 · Fondations
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Pilotez votre budget <span className="text-indigo-600">en toute simplicité</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Suivez vos dépenses, fixez vos budgets et visualisez où va votre argent.
            Une interface moderne propulsée par Django REST Framework et React.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Commencer
            </button>
            <button
              type="button"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              En savoir plus
            </button>
          </div>
        </section>

        {/* Cartes de stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <p className={`mt-2 text-2xl font-bold tracking-tight ${s.accent}`}>{s.value}</p>
              <p className="mt-1 text-xs text-slate-400">{s.hint}</p>
            </div>
          ))}
        </section>

        {/* Transactions récentes */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Transactions récentes</h2>
            <span className="text-xs text-slate-400">aperçu (mock)</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {TRANSACTIONS.map((t) => (
              <li key={t.label} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-400">{t.category} · {t.when}</p>
                </div>
                <p className={`text-sm font-semibold ${t.positive ? 'text-emerald-600' : 'text-slate-700'}`}>
                  {t.amount}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Note backend hors-ligne */}
        {status === 'offline' && (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">Le backend ne répond pas.</p>
            <p className="mt-1">
              Démarre-le avec <code className="rounded bg-amber-100 px-1.5 py-0.5">cd backend &amp;&amp; .venv/Scripts/python manage.py runserver</code>.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 py-6">
        <p className="mx-auto max-w-5xl px-6 text-center text-xs text-slate-400">
          Sako Trackeur · Django REST Framework + React + Tailwind
        </p>
      </footer>
    </div>
  )
}

export default App
