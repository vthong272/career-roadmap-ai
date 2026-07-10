import { createContext, useContext } from 'react'
import type { User } from '../../types'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isBootstrapping: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  request: <T>(path: string, options?: RequestInit) => Promise<T>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
