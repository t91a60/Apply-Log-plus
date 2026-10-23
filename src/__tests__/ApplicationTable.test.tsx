import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
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
    const table = within(screen.getByRole('table'))
    expect(table.getByText('Applied')).toBeInTheDocument()
    expect(table.getByText('Interview')).toBeInTheDocument()
    expect(table.getByText('Rejected')).toBeInTheDocument()
  })

  it('labels search and filters by stage', () => {
    renderWithProviders(<ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter by stage' }), { target: { value: 'Interview' } })
    expect(screen.getByText('Meta')).toBeInTheDocument()
    expect(screen.queryByText('Google')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('1 application shown')
  })

  it('explains empty filtered results and clears both filters', () => {
    renderWithProviders(<ApplicationTable applications={apps} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'No match' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Interview' } })
    expect(screen.getByText('No applications match these filters.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByRole('table', { name: 'Job applications' })).toBeInTheDocument()
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Meta')).toBeInTheDocument()
  })
})
