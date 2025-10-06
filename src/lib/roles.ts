/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines user roles and their permissions
 */

export type UserRole =
  | 'patron'          // Patron - Full access
  | 'genel_mudur'     // Genel Müdür - Full access except critical settings
  | 'muhasebeci'      // Muhasebeci - Finance, reports, customers
  | 'depocu'          // Depocu - Stock management only
  | 'usta'            // Usta - Quality control only
  | 'admin';          // Admin - System administration

// Route permissions by role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  patron: [
    '/dashboard',
    '/projects',
    '/stock',
    '/employees',
    '/customers',
    '/quality-control',
    '/reports',
    '/tasks',
    '/attendance',
    '/settings',
  ],
  genel_mudur: [
    '/dashboard',
    '/projects',
    '/stock',
    '/employees',
    '/customers',
    '/quality-control',
    '/reports',
    '/attendance',
    '/settings',
  ],
  muhasebeci: [
    '/dashboard',
    '/projects',
    '/customers',
    '/reports',
    '/employees',
    '/attendance',
  ],
  depocu: [
    '/dashboard',
    '/stock',
  ],
  usta: [
    '/dashboard',
    '/quality-control',
  ],
  admin: [
    '/dashboard',
    '/projects',
    '/stock',
    '/employees',
    '/customers',
    '/quality-control',
    '/reports',
    '/tasks',
    '/attendance',
    '/settings',
  ],
};

// Role display names in Turkish
export const ROLE_LABELS: Record<UserRole, string> = {
  patron: 'Patron',
  genel_mudur: 'Genel Müdür',
  muhasebeci: 'Muhasebeci',
  depocu: 'Depo Sorumlusu',
  usta: 'Kalite Kontrol Ustası',
  admin: 'Sistem Yöneticisi',
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  patron: 'Tam yetki - Tüm modüllere erişim',
  genel_mudur: 'Yönetim yetkisi - Görevler hariç tüm modüller',
  muhasebeci: 'Muhasebe, raporlama, personel ve puantaj erişimi',
  depocu: 'Stok yönetimi erişimi',
  usta: 'Kalite kontrol erişimi',
  admin: 'Sistem yönetimi yetkisi',
};

/**
 * Check if user has access to a specific route
 */
export function hasAccess(userRole: UserRole | null, route: string): boolean {
  if (!userRole) return false;

  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  // Check if route starts with any of the allowed paths
  return permissions.some(path => route.startsWith(path));
}

/**
 * Get allowed routes for a user role
 */
export function getAllowedRoutes(userRole: UserRole | null): string[] {
  if (!userRole) return [];
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if role can perform specific actions
 */
export const CAN_MANAGE_EMPLOYEES = ['patron', 'genel_mudur', 'muhasebeci', 'admin'];
export const CAN_MANAGE_STOCK = ['patron', 'genel_mudur', 'depocu', 'admin'];
export const CAN_MANAGE_PROJECTS = ['patron', 'genel_mudur', 'admin'];
export const CAN_MANAGE_QUALITY = ['patron', 'genel_mudur', 'usta', 'admin'];
export const CAN_VIEW_REPORTS = ['patron', 'genel_mudur', 'muhasebeci', 'admin'];
export const CAN_MANAGE_CUSTOMERS = ['patron', 'genel_mudur', 'muhasebeci', 'admin'];
export const CAN_CHANGE_SETTINGS = ['patron', 'genel_mudur', 'admin'];
export const CAN_VIEW_ACTIVITY_LOGS = ['patron', 'admin'];

/**
 * Helper function to check if user can perform action
 */
export function canPerformAction(userRole: UserRole | null, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
