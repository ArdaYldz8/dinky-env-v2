import { useState } from 'react'
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import useAuthStore from '../../stores/authStore'

export default function DashboardLayout() {
  const { user, signOut } = useAuthStore()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState(null)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const navigation = [
    { name: 'Ana Sayfa', path: '/dashboard', icon: '🏠' },
    {
      name: 'Personel',
      icon: '👥',
      isDropdown: true,
      children: [
        { name: 'Personel Yönetimi', path: '/employees', icon: '👤' },
        { name: 'Puantaj', path: '/attendance', icon: '📅' },
        { name: 'Görevler', path: '/tasks', icon: '✓' },
      ]
    },
    {
      name: 'Projeler',
      icon: '📊',
      isDropdown: true,
      children: [
        { name: 'Proje Listesi', path: '/projects', icon: '📁' },
        { name: 'Kalite Kontrol', path: '/quality-control', icon: '✅' },
        { name: 'Müşteriler', path: '/customers', icon: '🏢' },
      ]
    },
    { name: 'Stok', path: '/stock', icon: '📦' },
    { name: 'Raporlar', path: '/reports', icon: '📈' },
    { name: 'Ayarlar', path: '/settings', icon: '⚙️' },
  ]

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

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = isPathActive(item)

            if (item.isDropdown) {
              const isOpen = openDropdown === item.name
              return (
                <div key={item.name}>
                  {/* Dropdown Header */}
                  <button
                    onClick={() => toggleDropdown(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Items */}
                  {isOpen && (
                    <div className="mt-1 ml-4 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = location.pathname === child.path
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition text-sm ${
                              isChildActive
                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-lg">{child.icon}</span>
                            <span>{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {user.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-red-600 transition"
              title="Çıkış Yap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h2 className="text-xl font-semibold text-gray-900">
            {getCurrentPageName()}
          </h2>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
