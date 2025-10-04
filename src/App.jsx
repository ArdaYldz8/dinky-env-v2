import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import useAuthStore from './stores/authStore'
import ErrorBoundary from './shared/components/ErrorBoundary'

// Eager load critical routes
import LoginPage from './features/auth/LoginPage'
import DashboardLayout from './shared/layouts/DashboardLayout'
import DashboardPage from './features/auth/DashboardPage'

// Lazy load feature routes for better performance
const EmployeesPage = lazy(() => import('./features/employees/EmployeesPage'))
const AttendancePage = lazy(() => import('./features/attendance/AttendancePage'))
const TasksPage = lazy(() => import('./features/tasks/TasksPage'))
const StockPage = lazy(() => import('./features/stock/StockPage'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const ReportsPage = lazy(() => import('./features/reports/ReportsPage'))
const CustomersPage = lazy(() => import('./features/customers/CustomersPage'))
const ProjectsPage = lazy(() => import('./features/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./features/projects/ProjectDetailPage'))
const QualityControlPage = lazy(() => import('./features/quality-control/QualityControlPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  )
}

function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="quality-control" element={<QualityControlPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="stock" element={<StockPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
        {/* React Query DevTools - Only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
