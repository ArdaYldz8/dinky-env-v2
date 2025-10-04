import { useState, useCallback } from 'react'

/**
 * Custom hook for toast notifications
 * Provides consistent toast behavior across the application
 *
 * @returns {Object} Toast state and methods
 */
export default function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type })

    if (duration > 0) {
      setTimeout(() => {
        setToast(null)
      }, duration)
    }
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration)
  }, [showToast])

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration)
  }, [showToast])

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration)
  }, [showToast])

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration)
  }, [showToast])

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}
