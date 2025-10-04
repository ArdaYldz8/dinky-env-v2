import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { hasAccess, UserRole } from '../lib/roles'
import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get employee record with role
        const { data, error } = await supabase
          .from('employees')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setUserRole(data?.role as UserRole || null)
      } catch (error) {
        console.error('Error fetching user role:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [user])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // No role assigned
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600 mb-4">Hesabınıza rol atanmamış. Lütfen yöneticinizle iletişime geçin.</p>
          <button
            onClick={() => useAuthStore.getState().signOut()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    )
  }

  // Check role-specific access
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Yetkisiz Erişim</h2>
            <p className="text-gray-600 mb-4">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Geri Dön
            </button>
          </div>
        </div>
      )
    }
  }

  // Check route-based access
  const currentPath = location.pathname
  if (!hasAccess(userRole, currentPath)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
