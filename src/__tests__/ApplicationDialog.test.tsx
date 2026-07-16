import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { ApplicationDialog } from '@/components/applications/ApplicationDialog'
import type { Application } from '@/db/schema'
import { renderWithProviders } from './test-utils'
import * as urlMetadata from '@/lib/urlMetadata'

vi.mock('@/lib/urlMetadata', () => ({
  fetchUrlMetadata: vi.fn(),
}))

const baseApp: Application = {
  id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

describe('ApplicationDialog', () => {
  const onSubmit = vi.fn()
  const onOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders add form when open', () => {
    renderWithProviders(
      <ApplicationDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    )
    expect(screen.getByText('Add Application')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderWithProviders(
      <ApplicationDialog open={false} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    )
    expect(screen.queryByText('Add Application')).not.toBeInTheDocument()
  })

  it('shows edit title when editing', () => {
    renderWithProviders(
      <ApplicationDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={baseApp}
      />
    )
    expect(screen.getByText('Edit Application')).toBeInTheDocument()
  })

  it('pre-fills form fields when editing', () => {
    renderWithProviders(
      <ApplicationDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={baseApp}
      />
    )
    const companyInput = screen.getByDisplayValue('Google') as HTMLInputElement
    expect(companyInput).toBeInTheDocument()
    const roleInput = screen.getByDisplayValue('Engineer') as HTMLInputElement
    expect(roleInput).toBeInTheDocument()
  })

  it('shows duplicate warning when duplicate detected', () => {
    const existing = [{ ...baseApp, id: '2', company: 'Google', role: 'Engineer' }]
    renderWithProviders(
      <ApplicationDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        allApplications={existing}
      />
    )
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Google' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Engineer' } })

    expect(screen.getByText(/already exist in your list/)).toBeInTheDocument()
  })

  it('calls onSubmit with application data', () => {
    renderWithProviders(
      <ApplicationDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    )

    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'TestCorp' } })
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Developer' } })

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.company).toBe('TestCorp')
    expect(submitted.role).toBe('Developer')
    expect(submitted.currentStage).toBe('Applied')
  })

  it('calls onSubmit with stage change when editing', () => {
    renderWithProviders(
      <ApplicationDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={baseApp}
      />
    )

    const saveBtn = screen.getByText('Save')
    fireEvent.click(saveBtn)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const submitted = onSubmit.mock.calls[0][0]
    expect(submitted.timeline).toHaveLength(1)
  })

  it('shows import error for failed URL import', async () => {
    vi.mocked(urlMetadata.fetchUrlMetadata).mockResolvedValueOnce({
      success: false,
      data: null,
    })

    renderWithProviders(
      <ApplicationDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    )

    const urlInput = screen.getByLabelText('Link to offer')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/job' } })

    const importBtn = screen.getByText('Import')
    fireEvent.click(importBtn)

    await waitFor(() => {
      expect(screen.getByText('Could not fetch preview from this URL')).toBeInTheDocument()
    })
  })

  it('cancels and closes', () => {
    renderWithProviders(
      <ApplicationDialog open={true} onOpenChange={onOpenChange} onSubmit={onSubmit} />
    )

    const cancelBtn = screen.getByText('Cancel')
    fireEvent.click(cancelBtn)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('shows timeline when editing an application with timeline', () => {
    const appWithTimeline: Application = {
      ...baseApp,
      timeline: [
        { stage: 'Applied', date: '2024-01-01T10:00:00Z' },
        { stage: 'Interview', date: '2024-01-15T10:00:00Z' },
      ],
    }
    renderWithProviders(
      <ApplicationDialog
        open={true}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialData={appWithTimeline}
      />
    )

    expect(screen.getByText('Timeline')).toBeInTheDocument()
  })
})
