import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "../context/AuthContext"

/** Inverse de ProtectedRoute : redirige un user déjà connecté vers /. */
export default function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      </div>
    )
  }
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}
