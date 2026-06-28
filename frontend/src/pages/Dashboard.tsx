import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../api/client"
import { useAuth } from "../context/AuthContext"

type Summary = {
  today: number
  week: number
  month: number
  total: number
  income_month: number
  balance: number
}

const CURRENCY: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  CHF: "CHF",
  CAD: "C$",
}

type Card = {
  label: string
  value: number | undefined
  icon: string
  accent: string
  ring: string
  hint: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const currency = user?.currency || "EUR"
  const symbol = CURRENCY[currency] ?? ""
  const [stats, setStats] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Summary>("/analytics/summary/")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number | undefined) =>
    (Number(n) || 0).toLocaleString("fr-FR", {
      style: "currency",
      currency,
    })

  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—"

  const cards: Card[] = [
    {
      label: "Dépenses du mois",
      value: stats?.month,
      icon: "📅",
      accent: "text-indigo-600",
      ring: "ring-indigo-100",
      hint: "Ce mois-ci",
    },
    {
      label: "Dépenses de la semaine",
      value: stats?.week,
      icon: "🗓️",
      accent: "text-blue-600",
      ring: "ring-blue-100",
      hint: "Depuis lundi",
    },
    {
      label: "Dépenses du jour",
      value: stats?.today,
      icon: "⚡",
      accent: "text-rose-600",
      ring: "ring-rose-100",
      hint: "Aujourd'hui",
    },
    {
      label: "Total général",
      value: stats?.total,
      icon: "💰",
      accent: "text-emerald-600",
      ring: "ring-emerald-100",
      hint: "Toutes tes dépenses",
    },
  ]

  const balance = Number(stats?.balance ?? 0)

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
          Espace personnel
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Bonjour {user?.first_name || user?.username} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Voici un aperçu de tes dépenses — tes données sont privées et propres à
          ton compte.
        </p>
      </div>

      {/* 4 cartes statistiques */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ${c.ring}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{c.label}</span>
              <span className="text-xl" aria-hidden>
                {c.icon}
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${c.accent}`}>
              {loading ? "…" : fmt(c.value)}
            </p>
            <p className="mt-1 text-xs text-slate-400">{c.hint}</p>
          </div>
        ))}
      </section>

      {/* Revenus & solde du mois */}
      {stats && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Revenus du mois</p>
            <p className="text-xl font-bold text-emerald-600">
              {fmt(stats.income_month)}
            </p>
          </div>
          <div className="hidden h-10 w-px bg-slate-200 sm:block" />
          <div>
            <p className="text-sm text-slate-500">Solde du mois</p>
            <p
              className={`text-xl font-bold ${
                balance >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {balance >= 0 ? "+" : "−"}
              {fmt(Math.abs(balance))}
            </p>
          </div>
          <Link
            to="/expenses"
            className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            Gérer mes dépenses →
          </Link>
        </section>
      )}

      {/* Mon compte */}
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
              <dd className="font-medium text-slate-800">
                {currency} ({symbol})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Membre depuis</dt>
              <dd className="font-medium text-slate-800">{memberSince}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-5">
          <h2 className="mb-2 font-semibold text-slate-900">Conseil</h2>
          <p className="text-sm text-slate-600">
            Ajoute tes dépenses au fil de l'eau pour garder des statistiques
            fiables. Pense à enregistrer ton salaire comme « Salaire » (revenu)
            pour suivre ton solde mensuel.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/expenses"
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
            >
              + Dépense
            </Link>
            <Link
              to="/categories"
              className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              Catégories
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
