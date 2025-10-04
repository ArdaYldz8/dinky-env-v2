import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../stores/authStore'
import { UserRole } from '../lib/roles'

export function useUserRole() {
  const { user } = useAuthStore()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('employees')
          .select('role, full_name, position')
          .eq('user_id', user.id)
          .single()

        if (fetchError) throw fetchError

        setUserRole((data?.role as UserRole) || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching user role:', err)
        setError(err as Error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  return { userRole, loading, error }
}
