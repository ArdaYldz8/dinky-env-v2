import * as Sentry from "@sentry/react"

// Initialize Sentry monitoring
export function initMonitoring() {
  // Only initialize in production or when explicitly enabled
  if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_MONITORING === 'true') {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,

      // Performance Monitoring
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

      // Session Replay
      replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0,

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || '2.0.0',

      // Integrations
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Filter out noisy errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random network errors
        'Network request failed',
        'NetworkError',
        // ResizeObserver loop errors (not critical)
        'ResizeObserver loop limit exceeded',
      ],

      // Before sending events, you can modify or filter them
      beforeSend(event, hint) {
        // Don't send events if user is in development
        if (import.meta.env.DEV) {
          console.log('Sentry event (dev mode):', event)
          return null
        }

        return event
      },
    })
  }
}

// Custom error logging with context
export function logError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.error('Error:', error, context)
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

// Log custom events/messages
export function logMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

// Set user context for error tracking
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.role,
  })
}

// Clear user context on logout
export function clearUserContext() {
  Sentry.setUser(null)
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  })
}

// Performance monitoring for critical operations
// Replaced startTransaction with startSpan (Sentry v10 migration)
export function measurePerformance<T>(
  name: string,
  op: string,
  callback: () => T | Promise<T>
): T | Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  )
}
