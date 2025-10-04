import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { setUserContext, clearUserContext, logError } from '../services/monitoring'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  // Initialize auth state
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Set user context for monitoring if authenticated
      if (session?.user) {
        setUserContext({
          id: session.user.id,
          email: session.user.email || '',
          role: session.user.role
        })
      }

      set({ session, user: session?.user || null, loading: false })
    } catch (error) {
      console.error('Auth initialization error:', error)
      logError(error as Error, { context: 'auth_initialization' })
      set({ loading: false })
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Set user context for monitoring
    if (data.user) {
      setUserContext({
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.role
      })
    }

    set({ session: data.session, user: data.user })
    return data
  },

  // Sign out
  signOut: async () => {
    await supabase.auth.signOut()
    clearUserContext() // Clear monitoring context
    set({ session: null, user: null })
  },

  // Update user state
  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session, user: session?.user || null }),
}))

export { useAuthStore }
export default useAuthStore
