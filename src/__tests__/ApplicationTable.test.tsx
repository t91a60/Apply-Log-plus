import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import type { Application } from '@/db/schema'
import { renderWithProviders } from './test-utils'

const baseApp: Application = {
  id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

const apps: Application[] = [
  baseApp,
  { ...baseApp, id: '2', company: 'Meta', role: 'Designer', currentStage: 'Interview' },
  { ...baseApp, id: '3', company: 'Apple', role: 'Manager', currentStage: 'Rejected' },
]

describe('ApplicationTable', () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no applications', () => {
    renderWithProviders(
      <ApplicationTable applications={[]} onEdit={onEdit} onDelete={onDelete} />
    )
    expect(screen.getByText('No applications yet. Add your first one!')).toBeInTheDocument()
  })

  it('renders all applications', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Meta')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('filters by search query (company)', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    const searchInput = screen.getByPlaceholderText('Search company or role...')
    fireEvent.change(searchInput, { target: { value: 'Google' } })
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.queryByText('Meta')).not.toBeInTheDocument()
  })

  it('filters by search query (role)', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    const searchInput = screen.getByPlaceholderText('Search company or role...')
    fireEvent.change(searchInput, { target: { value: 'Designer' } })
    expect(screen.getByText('Meta')).toBeInTheDocument()
  })

  it('calls onEdit when Edit Application button clicked', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    const editButtons = screen.getAllByText('Edit Application')
    fireEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(apps[0])
  })

  it('calls onDelete when Delete button clicked', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])
    expect(onDelete).toHaveBeenCalledWith(apps[0].id)
  })

  it('toggles timeline expansion', () => {
    renderWithProviders(
      <ApplicationTable applications={[apps[0]]} onEdit={onEdit} onDelete={onDelete} />
    )
    const timelineBtn = screen.getByText('Timeline')
    fireEvent.click(timelineBtn)

    const timelineHeadings = screen.getAllByText('Timeline')
    expect(timelineHeadings.length).toBeGreaterThanOrEqual(1)

    const hideBtn = screen.getByText('Hide')
    fireEvent.click(hideBtn)
    expect(screen.queryByText('Hide')).not.toBeInTheDocument()
  })

  it('shows StageBadge for each application', () => {
    renderWithProviders(
      <ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />
    )
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })
})
