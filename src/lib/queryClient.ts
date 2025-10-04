import { QueryClient } from '@tanstack/react-query'

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus (useful for real-time data)
      refetchOnWindowFocus: true,

      // Refetch on reconnect
      refetchOnReconnect: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
})

// Query keys factory for type-safe and organized keys
export const queryKeys = {
  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    phases: (projectId: string) => [...queryKeys.projects.all, projectId, 'phases'] as const,
    tasks: (phaseId: string) => [...queryKeys.projects.all, 'phases', phaseId, 'tasks'] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.employees.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.employees.all, id] as const,
  },

  // Stock
  stock: {
    all: ['stock'] as const,
    items: () => [...queryKeys.stock.all, 'items'] as const,
    item: (id: string) => [...queryKeys.stock.items(), id] as const,
    movements: () => [...queryKeys.stock.all, 'movements'] as const,
    categories: () => [...queryKeys.stock.all, 'categories'] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    records: (filters: Record<string, unknown>) => [...queryKeys.attendance.all, 'records', filters] as const,
    stats: (date: string) => [...queryKeys.attendance.all, 'stats', date] as const,
  },

  // Quality Control
  quality: {
    all: ['quality'] as const,
    issues: (projectId: string) => [...queryKeys.quality.all, 'issues', projectId] as const,
    stats: (projectId: string) => [...queryKeys.quality.all, 'stats', projectId] as const,
  },

  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.customers.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.customers.all, id] as const,
  },

  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    charts: ['dashboard', 'charts'] as const,
  },
}
