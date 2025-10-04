import { useState, useCallback } from 'react'

/**
 * Custom hook for modal management
 * Provides consistent modal state management across the application
 *
 * @returns {Object} Modal state and methods
 */
export default function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalData, setModalData] = useState(null)

  const openModal = useCallback((data = null) => {
    setModalData(data)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Delay clearing data to allow close animation
    setTimeout(() => setModalData(null), 300)
  }, [])

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
    toggleModal,
  }
}
