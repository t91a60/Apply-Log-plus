import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { renderWithProviders } from './test-utils'

function Example() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open form</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Application details</DialogTitle></DialogHeader>
          <label>Company<input /></label>
        </DialogContent>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('labels the native modal and restores scroll after closing', () => {
    document.body.style.overflow = 'auto'
    renderWithProviders(<Example />)
    fireEvent.click(screen.getByText('Open form'))
    expect(screen.getByRole('dialog', { name: 'Application details' })).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('auto')
    document.body.style.overflow = ''
  })

  it('syncs a native Escape cancel request with React state', () => {
    renderWithProviders(<Example />)
    fireEvent.click(screen.getByText('Open form'))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open form'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('restores scroll when unmounted while open', () => {
    const { unmount } = renderWithProviders(<Example />)
    fireEvent.click(screen.getByText('Open form'))
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
