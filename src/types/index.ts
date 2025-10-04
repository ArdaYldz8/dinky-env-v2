// Central type definitions for the application
export * from './database.types'

// Common UI Types
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export interface ModalState<T = unknown> {
  isOpen: boolean
  data: T | null
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data: T | null
  error: Error | null
  loading: boolean
}

export interface SupabaseError {
  message: string
  code?: string
  details?: string
}

// Form Types
export interface FormState<T> {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
  isDirty: boolean
}

// Filter & Search Types
export interface PaginationState {
  currentPage: number
  itemsPerPage: number
  totalCount: number
  totalPages: number
}

export interface FilterState {
  searchQuery: string
  categoryFilter: string
  statusFilter: string
  dateFrom?: string
  dateTo?: string
}

// Dashboard Types
export interface KPIStats {
  activeProjects: number
  todayAttendance: number
  criticalStock: number
  openIssues: number
}

export interface ChartData {
  attendanceDates: string[]
  attendancePresent: number[]
  attendanceAbsent: number[]
  projectNames: string[]
  projectProgress: number[]
}

// Notification Types
export interface Notification {
  type: 'danger' | 'warning' | 'info'
  icon: string
  title: string
  message: string
  action?: () => void
}

// Project Types Extended
export interface ProjectDeadlineWarning {
  id: string
  project_name: string
  end_date: string
  daysUntil: number
  urgency: 'danger' | 'warning'
}

// Stock Types Extended
export interface StockMovementWithItem {
  id: string
  movement_type: 'Giriş' | 'Çıkış'
  quantity: number
  movement_date: string
  stock_items?: {
    item_name: string
  }
}

// Quality Control Types Extended
export interface QualityIssueStats {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  critical: number
  high: number
}
