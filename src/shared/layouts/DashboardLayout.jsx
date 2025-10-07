import { useState } from 'react'
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'
import { useUserRole } from '../../hooks/useUserRole'
import { hasAccess, ROLE_LABELS } from '../../lib/roles'

export default function DashboardLayout() {
  const { user, signOut } = useAuthStore()
  const { userRole, loading: roleLoading } = useUserRole()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState(null)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Role-based navigation configuration
  const getAllNavigation = (role) => {
    const baseNav = [
      { name: 'Ana Sayfa', path: '/dashboard', icon: '🏠', roles: ['patron', 'genel_mudur', 'muhasebeci', 'depocu', 'usta', 'admin'] },
    ]

    const fullNav = [
      { name: 'Ana Sayfa', path: '/dashboard', icon: '🏠', roles: ['patron', 'genel_mudur', 'muhasebeci', 'depocu', 'usta', 'admin'] },
      {
        name: 'Personel',
        icon: '👥',
        isDropdown: true,
        roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'],
        children: [
          { name: 'Personel Yönetimi', path: '/employees', icon: '👤', roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'] },
          { name: 'Puantaj', path: '/attendance', icon: '📅', roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'] },
          { name: 'Görevler', path: '/tasks', icon: '✓', roles: ['patron', 'admin'] },
        ]
      },
      {
        name: 'Projeler',
        icon: '📊',
        isDropdown: true,
        roles: ['patron', 'genel_mudur', 'muhasebeci', 'usta', 'admin'],
        children: [
          { name: 'Proje Listesi', path: '/projects', icon: '📁', roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'] },
          { name: 'Müşteriler', path: '/customers', icon: '🏢', roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'] },
          { name: 'Kalite Kontrol', path: '/quality-control', icon: '✅', roles: ['patron', 'genel_mudur', 'usta', 'admin'] },
        ]
      },
      { name: 'Stok', path: '/stock', icon: '📦', roles: ['patron', 'genel_mudur', 'depocu', 'admin'] },
      { name: 'Raporlar', path: '/reports', icon: '📈', roles: ['patron', 'genel_mudur', 'muhasebeci', 'admin'] },
      { name: 'Ayarlar', path: '/settings', icon: '⚙️', roles: ['patron', 'genel_mudur', 'admin'] },
    ]

    // Filter navigation based on role
    if (!role) return baseNav

    return fullNav.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(role)
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            if (!child.roles) return true
            return child.roles.includes(role)
          })
        }
      }
      return item
    })
  }

  const navigation = getAllNavigation(userRole)

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const isPathActive = (item) => {
    if (item.path) {
      return location.pathname === item.path
    }
    if (item.children) {
      return item.children.some(child => location.pathname === child.path)
    }
    return false
  }

  const getCurrentPageName = () => {
    for (const item of navigation) {
      if (item.path === location.pathname) {
        return item.name
      }
      if (item.children) {
        const child = item.children.find(c => c.path === location.pathname)
        if (child) return child.name
      }
    }
    return 'Ana Sayfa'
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">D</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Dinky Metal</h1>
              <p className="text-xs text-gray-500">ERP Sistemi</p>
            </div>
          </div>
        </div>

        {/* User Role Badge */}
        {userRole && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-indigo-600">
                {ROLE_LABELS[userRole]}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
          {navigation.map((item) => (
            <div key={item.name}>
              {item.isDropdown ? (
                <div>
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition ${
                      isPathActive(item)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center space-x-3">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item.name && item.children && (
                    <div className="mt-1 ml-6 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition ${
                            location.pathname === child.path
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{child.icon}</span>
                          <span>{child.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User menu at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-gray-600 transition"
              title="Çıkış Yap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        {/* Top bar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-gray-900">{getCurrentPageName()}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
