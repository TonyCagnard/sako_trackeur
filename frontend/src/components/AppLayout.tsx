import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LogOut,
  Menu,
  PiggyBank,
  Receipt,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import ThemeToggle from "./ThemeToggle"

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const NAV: NavItem[] = [
  { to: "/", label: "Patrimoine", icon: Wallet, end: true },
  { to: "/expenses", label: "Dépenses", icon: Receipt },
  { to: "/revenus", label: "Revenus", icon: TrendingUp },
  { to: "/categories", label: "Catégories", icon: Tags },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/objectifs", label: "Objectifs", icon: Target },
  { to: "/conseils", label: "Conseils", icon: Sparkles },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg">
        <span className="text-base font-bold">S</span>
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-content">
        Sako Trackeur
      </span>
    </Link>
  )
}

function SidebarContent({
  onNavigate,
  onLogout,
}: {
  onNavigate: () => void
  onLogout: () => void
}) {
  const { user } = useAuth()
  return (
    <>
      <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-surface-2 hover:text-content",
              ].join(" ")
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-content">
            {(user?.first_name || user?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-content">
              {user?.first_name || user?.username}
            </p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              to="/profile"
              aria-label="Profil"
              title="Profil"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-content"
            >
              <User size={18} />
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-content"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas text-content">
      {/* Sidebar fixe (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <SidebarContent onNavigate={() => {}} onLogout={handleLogout} />
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface">
            <SidebarContent onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-content"
          >
            <Menu size={20} />
          </button>
          <Brand />
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
