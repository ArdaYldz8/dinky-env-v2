// Supabase Database Types
// Auto-generated types will go here when we run: npx supabase gen types typescript

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Database Tables
export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          email: string
          role: 'patron' | 'genel_mudur' | 'muhasebeci' | 'depocu' | 'usta' | 'admin'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
      }
      employees: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone: string | null
          department: string | null
          position: string | null
          hire_date: string | null
          salary: number | null
          is_active: boolean
          role: 'patron' | 'genel_mudur' | 'muhasebeci' | 'depocu' | 'usta' | 'admin' | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['employees']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['employees']['Insert']>
      }
      customers: {
        Row: {
          id: string
          company_name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          tax_office: string | null
          tax_number: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      projects: {
        Row: {
          id: string
          project_name: string
          customer_id: string | null
          project_manager_id: string | null
          status: 'Aktif' | 'Tamamlandı' | 'İptal' | 'Beklemede'
          project_type: 'customer_project' | 'internal_location'
          planned_start_date: string | null
          planned_end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          budget: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_phases: {
        Row: {
          id: string
          project_id: string
          phase_code: string
          phase_name: string
          description: string | null
          order_number: number
          status: 'Planlanıyor' | 'Başlatıldı' | 'Devam Ediyor' | 'Beklemede' | 'Tamamlandı' | 'İptal Edildi'
          progress: number
          planned_start_date: string | null
          planned_end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_phases']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['project_phases']['Insert']>
      }
      project_tasks: {
        Row: {
          id: string
          phase_id: string
          task_code: string
          task_name: string
          description: string | null
          product_info: string | null
          product_code: string | null
          quantity_info: string | null
          meterage_info: string | null
          task_type: 'İmalat' | 'Montaj' | 'Kaplama' | 'Kontrol' | 'Sevkiyat' | 'Diğer'
          status: 'Atanmadı' | 'Planlandı' | 'Başlatıldı' | 'Devam Ediyor' | 'Beklemede' | 'Tamamlandı' | 'İptal Edildi'
          progress: number
          assigned_to: string | null
          order_number: number
          planned_start_date: string | null
          planned_end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_tasks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['project_tasks']['Insert']>
      }
      stock_items: {
        Row: {
          id: string
          item_name: string
          item_code: string | null
          category: string | null
          subcategory: string | null
          barcode: string | null
          unit: string
          current_stock: number
          min_stock: number | null
          max_stock: number | null
          unit_price: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stock_items']['Insert']>
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          movement_type: 'Giriş' | 'Çıkış'
          quantity: number
          movement_date: string
          employee_id: string | null
          project_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stock_movements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['stock_movements']['Insert']>
      }
      attendance_records: {
        Row: {
          id: string
          employee_id: string
          work_date: string
          status: 'Tam Gün' | 'Yarım Gün' | 'Yok' | 'Gelmedi' | 'İzinli'
          project_id: string | null
          work_location_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['attendance_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['attendance_records']['Insert']>
      }
      quality_issues: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          priority: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
          status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'approved' | 'rejected'
          reported_by: string | null
          assigned_to: string | null
          reported_date: string
          resolved_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quality_issues']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quality_issues']['Insert']>
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          user_email: string | null
          user_role: string | null
          action: string
          table_name: string | null
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['activity_logs']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
