import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOKEN_KEY = 'access_token'

export interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string) => void
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, accessToken) => {
        if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, accessToken)
        set({ user, accessToken, isAuthenticated: true })
      },
      logout: () => {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY)
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && typeof localStorage !== 'undefined')
          localStorage.setItem(TOKEN_KEY, state.accessToken)
      },
    }
  )
)

export function getStoredToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
