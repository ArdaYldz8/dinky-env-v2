/**
 * Centralized Error Handling Utility
 * Provides consistent error handling across the application
 */

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  NETWORK: 'network',
  DATABASE: 'database',
  UNKNOWN: 'unknown',
}

/**
 * Get user-friendly error message in Turkish
 * @param {Error|Object} error - Error object from Supabase or other sources
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) return 'Bilinmeyen bir hata oluştu'

  // Supabase specific errors
  if (error.code) {
    switch (error.code) {
      // Authentication errors
      case 'invalid_credentials':
      case 'PGRST301':
        return 'E-posta veya şifre hatalı'
      case 'email_not_confirmed':
        return 'E-posta adresinizi doğrulamanız gerekiyor'
      case 'user_not_found':
        return 'Kullanıcı bulunamadı'
      case 'invalid_grant':
        return 'Oturum süresi doldu. Lütfen tekrar giriş yapın'

      // Authorization errors
      case 'insufficient_permissions':
      case 'PGRST401':
        return 'Bu işlem için yetkiniz yok'

      // Validation errors
      case '23505': // unique_violation
        return 'Bu kayıt zaten mevcut'
      case '23503': // foreign_key_violation
        return 'İlişkili kayıtlar nedeniyle bu işlem yapılamıyor'
      case '23502': // not_null_violation
        return 'Zorunlu alanlar eksik'
      case '23514': // check_violation
        return 'Geçersiz veri girişi'

      // Network errors
      case 'ECONNREFUSED':
      case 'ETIMEDOUT':
      case 'ENOTFOUND':
        return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin'

      default:
        break
    }
  }

  // HTTP status code errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Geçersiz istek'
      case 401:
        return 'Oturum açmanız gerekiyor'
      case 403:
        return 'Bu işlem için yetkiniz yok'
      case 404:
        return 'Kayıt bulunamadı'
      case 409:
        return 'Çakışan kayıt mevcut'
      case 422:
        return 'Veri doğrulama hatası'
      case 429:
        return 'Çok fazla istek. Lütfen bekleyin'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Sunucu hatası. Lütfen daha sonra tekrar deneyin'
      default:
        break
    }
  }

  // Generic error messages
  if (error.message) {
    const msg = error.message.toLowerCase()

    if (msg.includes('network')) {
      return 'Ağ bağlantısı hatası'
    }
    if (msg.includes('timeout')) {
      return 'İşlem zaman aşımına uğradı'
    }
    if (msg.includes('permission')) {
      return 'Yetki hatası'
    }
    if (msg.includes('duplicate')) {
      return 'Bu kayıt zaten mevcut'
    }
  }

  return 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

/**
 * Categorize error type
 * @param {Error|Object} error - Error object
 * @returns {string} Error type from ERROR_TYPES
 */
export function categorizeError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN

  // Authentication errors
  if (
    error.code === 'invalid_credentials' ||
    error.code === 'user_not_found' ||
    error.code === 'email_not_confirmed' ||
    error.status === 401
  ) {
    return ERROR_TYPES.AUTHENTICATION
  }

  // Authorization errors
  if (
    error.code === 'insufficient_permissions' ||
    error.code === 'PGRST401' ||
    error.status === 403
  ) {
    return ERROR_TYPES.AUTHORIZATION
  }

  // Validation errors
  if (
    error.code?.startsWith('23') ||
    error.status === 400 ||
    error.status === 422
  ) {
    return ERROR_TYPES.VALIDATION
  }

  // Not found errors
  if (error.status === 404 || error.code === 'PGRST116') {
    return ERROR_TYPES.NOT_FOUND
  }

  // Network errors
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.message?.includes('network')
  ) {
    return ERROR_TYPES.NETWORK
  }

  // Database errors
  if (error.code?.startsWith('P') || error.code?.startsWith('23')) {
    return ERROR_TYPES.DATABASE
  }

  return ERROR_TYPES.UNKNOWN
}

/**
 * Handle Supabase errors with logging and user-friendly messages
 * @param {Error|Object} error - Error object from Supabase
 * @param {Object} options - Additional options
 * @returns {string} User-friendly error message
 */
export function handleSupabaseError(error, options = {}) {
  const { logToConsole = true, showDetails = false } = options

  // Log to console in development
  if (logToConsole && process.env.NODE_ENV === 'development') {
    console.error('Supabase Error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      errorType: categorizeError(error),
    })
  }

  // Get user-friendly message
  const userMessage = getErrorMessage(error)

  // Add technical details in development mode
  if (showDetails && process.env.NODE_ENV === 'development' && error.message) {
    return `${userMessage} (${error.message})`
  }

  return userMessage
}

/**
 * Log error to external service (placeholder for future implementation)
 * @param {Error|Object} error - Error object
 * @param {Object} context - Additional context
 */
export function logErrorToService(error, context = {}) {
  // TODO: Implement error logging to external service (e.g., Sentry)
  // Example:
  // Sentry.captureException(error, { extra: context })

  if (process.env.NODE_ENV === 'development') {
    console.log('Error logged:', {
      error: error.message,
      errorType: categorizeError(error),
      context,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Create standardized error object
 * @param {string} message - Error message
 * @param {string} type - Error type from ERROR_TYPES
 * @param {Object} details - Additional details
 * @returns {Object} Standardized error object
 */
export function createError(message, type = ERROR_TYPES.UNKNOWN, details = {}) {
  return {
    message,
    type,
    details,
    timestamp: new Date().toISOString(),
  }
}

export default {
  ERROR_TYPES,
  getErrorMessage,
  categorizeError,
  handleSupabaseError,
  logErrorToService,
  createError,
}
