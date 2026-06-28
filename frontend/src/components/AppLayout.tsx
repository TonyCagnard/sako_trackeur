import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-600 hover:bg-slate-100"
  }`

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                S
              </div>
              <span className="font-semibold tracking-tight">Sako Trackeur</span>
            </Link>
            <nav className="flex gap-1">
              <NavLink to="/" end className={navClass}>
                Tableau de bord
              </NavLink>
              <NavLink to="/categories" className={navClass}>
                Catégories
              </NavLink>
              <NavLink to="/profile" className={navClass}>
                Profil
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-700">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
