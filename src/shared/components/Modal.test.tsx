import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

describe('Modal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    )

    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>Content</div>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('calls onClose when clicking overlay', () => {
    const handleClose = vi.fn()

    render(
      <Modal isOpen={true} onClose={handleClose}>
        <div>Content</div>
      </Modal>
    )

    // Find overlay (backdrop) and click it
    const overlay = screen.getByTestId('modal-overlay') ||
                    screen.getByText('Content').closest('.fixed')

    if (overlay) {
      fireEvent.click(overlay)
      expect(handleClose).toHaveBeenCalled()
    }
  })

  it('calls onClose when clicking X button', () => {
    const handleClose = vi.fn()

    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        <div>Content</div>
      </Modal>
    )

    const closeButton = screen.getByRole('button', { name: /close modal/i })
    fireEvent.click(closeButton)

    expect(handleClose).toHaveBeenCalled()
  })

  it('renders footer buttons when provided', () => {
    const handleSave = vi.fn()
    const handleCancel = vi.fn()

    render(
      <Modal isOpen={true} onClose={handleCancel} title="Test">
        <div>Content</div>
        <div slot="footer">
          <button onClick={handleCancel}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </Modal>
    )

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} className="custom-modal">
        <div>Content</div>
      </Modal>
    )

    expect(container.querySelector('.custom-modal')).toBeInTheDocument()
  })
})
