import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiRequest } from '../../api'
import { demoRequest, demoUserForCredentials, getDemoUser, setDemoStudentUser } from '../../demo-data'
import type { User } from '../../types'
import { AuthContext, type AuthContextValue } from './auth-context'

const TOKEN_KEY = 'career-roadmap-ai-token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    const demoUser = getDemoUser(token)
    if (demoUser) {
      setUser(demoUser)
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
        try {
          const payload = await apiRequest<{ token: string; user: User }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          })
          localStorage.setItem(TOKEN_KEY, payload.token)
          setToken(payload.token)
          setUser(payload.user)
        } catch (error) {
          const demoUser = demoUserForCredentials(email, password)
          if (!demoUser) throw error
          const demoToken = demoUser.role === 'COUNSELOR_ADMIN' ? 'demo:counselor' : 'demo:student'
          localStorage.setItem(TOKEN_KEY, demoToken)
          setToken(demoToken)
          setUser(demoUser)
        }
      },
      async register(name, email, password) {
        try {
          const payload = await apiRequest<{ token: string; user: User }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
          })
          localStorage.setItem(TOKEN_KEY, payload.token)
          setToken(payload.token)
          setUser(payload.user)
        } catch (error) {
          if (password.length < 8 || name.trim().length < 2 || !email.includes('@')) throw error
          const demoUser: User = {
            id: 'demo-registered-student',
            email: email.toLowerCase(),
            name,
            role: 'STUDENT',
            avatarUrl: null,
          }
          const demoToken = 'demo:student:registered'
          setDemoStudentUser(demoUser)
          localStorage.setItem(TOKEN_KEY, demoToken)
          setToken(demoToken)
          setUser(demoUser)
        }
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      },
      request<T>(path: string, options: RequestInit = {}) {
        if (token?.startsWith('demo:')) {
          return demoRequest<T>(path, options)
        }
        return apiRequest<T>(path, { ...options, token })
      },
    }),
    [isBootstrapping, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
