import { z } from 'zod'

// Common validation rules
const turkishPhoneRegex = /^(\+90|0)?[0-9]{10}$/
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Project validations
export const projectSchema = z.object({
  project_name: z.string()
    .min(3, 'Proje adı en az 3 karakter olmalıdır')
    .max(255, 'Proje adı en fazla 255 karakter olabilir'),

  customer_id: z.string()
    .uuid('Geçerli bir müşteri seçiniz')
    .optional()
    .nullable(),

  project_manager_id: z.string()
    .uuid('Geçerli bir proje yöneticisi seçiniz')
    .optional()
    .nullable(),

  status: z.enum(['Aktif', 'Tamamlandı', 'İptal', 'Beklemede']),

  project_type: z.enum(['customer_project', 'internal_location']),

  planned_start_date: z.string().optional().nullable(),
  planned_end_date: z.string().optional().nullable(),
  actual_start_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),

  budget: z.number()
    .positive('Bütçe pozitif bir sayı olmalıdır')
    .optional()
    .nullable(),

  description: z.string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional()
    .nullable(),
})

// Employee validations
export const employeeSchema = z.object({
  full_name: z.string()
    .min(2, 'Ad soyad en az 2 karakter olmalıdır')
    .max(255, 'Ad soyad en fazla 255 karakter olabilir'),

  email: z.string()
    .regex(emailRegex, 'Geçerli bir e-posta adresi giriniz')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone: z.string()
    .regex(turkishPhoneRegex, 'Geçerli bir telefon numarası giriniz (05XX XXX XX XX)')
    .optional()
    .nullable()
    .or(z.literal('')),

  department: z.string()
    .max(100, 'Departman adı en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  position: z.string()
    .max(100, 'Pozisyon adı en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  hire_date: z.string().optional().nullable(),

  salary: z.number()
    .positive('Maaş pozitif bir sayı olmalıdır')
    .optional()
    .nullable(),

  is_active: z.boolean().default(true),
})

// Stock item validations
export const stockItemSchema = z.object({
  item_name: z.string()
    .min(2, 'Ürün adı en az 2 karakter olmalıdır')
    .max(255, 'Ürün adı en fazla 255 karakter olabilir'),

  item_code: z.string()
    .max(100, 'Ürün kodu en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  category: z.string()
    .max(100, 'Kategori adı en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  subcategory: z.string()
    .max(100, 'Alt kategori adı en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  barcode: z.string()
    .max(50, 'Barkod en fazla 50 karakter olabilir')
    .optional()
    .nullable(),

  unit: z.string()
    .min(1, 'Birim gereklidir')
    .max(20, 'Birim en fazla 20 karakter olabilir'),

  current_stock: z.number()
    .nonnegative('Mevcut stok negatif olamaz')
    .default(0),

  min_stock: z.number()
    .nonnegative('Minimum stok negatif olamaz')
    .optional()
    .nullable(),

  max_stock: z.number()
    .nonnegative('Maksimum stok negatif olamaz')
    .optional()
    .nullable(),

  unit_price: z.number()
    .nonnegative('Birim fiyat negatif olamaz')
    .optional()
    .nullable(),
})
.refine(
  (data) => {
    if (data.min_stock && data.max_stock) {
      return data.min_stock <= data.max_stock
    }
    return true
  },
  {
    message: 'Minimum stok, maksimum stoktan büyük olamaz',
    path: ['min_stock'],
  }
)

// Stock movement validations
export const stockMovementSchema = z.object({
  item_id: z.string().uuid('Geçerli bir ürün seçiniz'),

  movement_type: z.enum(['Giriş', 'Çıkış'], {
    errorMap: () => ({ message: 'Geçerli bir hareket tipi seçiniz' }),
  }),

  quantity: z.number()
    .positive('Miktar pozitif bir sayı olmalıdır'),

  movement_date: z.string().min(1, 'Tarih gereklidir'),

  employee_id: z.string()
    .uuid('Geçerli bir personel seçiniz')
    .optional()
    .nullable(),

  project_id: z.string()
    .uuid('Geçerli bir proje seçiniz')
    .optional()
    .nullable(),

  notes: z.string()
    .max(500, 'Not en fazla 500 karakter olabilir')
    .optional()
    .nullable(),
})

// Customer validations
export const customerSchema = z.object({
  company_name: z.string()
    .min(2, 'Firma adı en az 2 karakter olmalıdır')
    .max(255, 'Firma adı en fazla 255 karakter olabilir'),

  contact_person: z.string()
    .max(255, 'İletişim kişisi en fazla 255 karakter olabilir')
    .optional()
    .nullable(),

  email: z.string()
    .regex(emailRegex, 'Geçerli bir e-posta adresi giriniz')
    .optional()
    .nullable()
    .or(z.literal('')),

  phone: z.string()
    .regex(turkishPhoneRegex, 'Geçerli bir telefon numarası giriniz')
    .optional()
    .nullable()
    .or(z.literal('')),

  address: z.string()
    .max(500, 'Adres en fazla 500 karakter olabilir')
    .optional()
    .nullable(),

  tax_office: z.string()
    .max(100, 'Vergi dairesi en fazla 100 karakter olabilir')
    .optional()
    .nullable(),

  tax_number: z.string()
    .max(20, 'Vergi numarası en fazla 20 karakter olabilir')
    .optional()
    .nullable(),

  is_active: z.boolean().default(true),
})

// Quality issue validations
export const qualityIssueSchema = z.object({
  project_id: z.string().uuid('Geçerli bir proje seçiniz'),

  title: z.string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(255, 'Başlık en fazla 255 karakter olabilir'),

  description: z.string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional()
    .nullable(),

  priority: z.enum(['Düşük', 'Orta', 'Yüksek', 'Kritik']),

  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'approved', 'rejected']),

  reported_by: z.string()
    .uuid('Geçerli bir personel seçiniz')
    .optional()
    .nullable(),

  assigned_to: z.string()
    .uuid('Geçerli bir personel seçiniz')
    .optional()
    .nullable(),

  reported_date: z.string().min(1, 'Rapor tarihi gereklidir'),

  resolved_date: z.string().optional().nullable(),
})

// Login validation
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'E-posta gereklidir')
    .regex(emailRegex, 'Geçerli bir e-posta adresi giriniz'),

  password: z.string()
    .min(6, 'Şifre en az 6 karakter olmalıdır'),
})

// Type exports for TypeScript
export type ProjectFormData = z.infer<typeof projectSchema>
export type EmployeeFormData = z.infer<typeof employeeSchema>
export type StockItemFormData = z.infer<typeof stockItemSchema>
export type StockMovementFormData = z.infer<typeof stockMovementSchema>
export type CustomerFormData = z.infer<typeof customerSchema>
export type QualityIssueFormData = z.infer<typeof qualityIssueSchema>
export type LoginFormData = z.infer<typeof loginSchema>
