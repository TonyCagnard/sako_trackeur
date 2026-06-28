import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import api, { tokenStorage } from "../api/client"

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  currency: string
  date_joined: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
  password2: string
  first_name?: string
  last_name?: string
  phone?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  updateUser: (patch: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Au montage : si on a un token, on récupère le profil courant
  useEffect(() => {
    const access = tokenStorage.getAccess()
    if (!access) {
      setLoading(false)
      return
    }
    api
      .get<User>("/auth/me/")
      .then((res) => setUser(res.data))
      .catch(() => {
        tokenStorage.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))

    // Déconnexion forcée (token expiré et refresh KO) depuis l'intercepteur
    const onForceLogout = () => {
      tokenStorage.clear()
      setUser(null)
    }
    window.addEventListener("auth:logout", onForceLogout)
    return () => window.removeEventListener("auth:logout", onForceLogout)
  }, [])

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/login/", { username, password })
    tokenStorage.set(data.access, data.refresh)
    setUser(data.user)
  }

  const register = async (payload: RegisterPayload) => {
    const { data } = await api.post("/auth/register/", payload)
    tokenStorage.set(data.access, data.refresh)
    setUser(data.user)
  }

  const logout = async () => {
    const refresh = tokenStorage.getRefresh()
    try {
      if (refresh) await api.post("/auth/logout/", { refresh })
    } catch {
      /* serveur KO ou déjà déconnecté : on nettoie quand même */
    } finally {
      tokenStorage.clear()
      setUser(null)
    }
  }

  const updateUser = (patch: Partial<User>) =>
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>")
  }
  return ctx
}
