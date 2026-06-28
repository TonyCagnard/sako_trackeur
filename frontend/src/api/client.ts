import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios"

// --- Persistance des tokens JWT (localStorage) ---
const ACCESS_KEY = "sako_access"
const REFRESH_KEY = "sako_refresh"

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// --- Instance axios de base (proxy Vite : /api -> http://localhost:8000) ---
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Attache le token d'accès à chaque requête sortante
api.interceptors.request.use((config) => {
  const access = tokenStorage.getAccess()
  if (access) {
    config.headers.Authorization = `Bearer ${access}`
  }
  return config
})

// Sur 401 : tente un refresh unique puis rejoue la requête, sinon déconnecte
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const url = original?.url ?? ""

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes("/auth/login/") &&
      !url.includes("/auth/refresh/")
    ) {
      original._retry = true
      const refresh = tokenStorage.getRefresh()
      if (refresh) {
        try {
          const { data } = await axios.post("/api/auth/refresh/", { refresh })
          tokenStorage.set(data.access, refresh)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          /* refresh échoué → on déconnecte ci-dessous */
        }
      }
      tokenStorage.clear()
      window.dispatchEvent(new Event("auth:logout"))
    }
    return Promise.reject(error)
  }
)

export default api
