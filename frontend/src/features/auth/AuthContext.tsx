import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../../api'
import type { User } from '../../types'

const TOKEN_KEY = 'career-roadmap-ai-token'

interface AuthContextValue {
  user: User | null
  token: string | null
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  request: <T>(path: string, options?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    apiRequest<{ user: User }>('/auth/me', { token })
      .then((payload) => setUser(payload.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsBootstrapping(false))
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isBootstrapping,
      async login(email, password) {
        const payload = await apiRequest<{ token: string; user: User }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        localStorage.setItem(TOKEN_KEY, payload.token)
        setToken(payload.token)
        setUser(payload.user)
      },
      async register(name, email, password) {
        const payload = await apiRequest<{ token: string; user: User }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        })
        localStorage.setItem(TOKEN_KEY, payload.token)
        setToken(payload.token)
        setUser(payload.user)
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      },
      request<T>(path: string, options: RequestInit = {}) {
        return apiRequest<T>(path, { ...options, token })
      },
    }),
    [isBootstrapping, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
