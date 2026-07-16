import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import App from '@/App'
import { renderWithProviders } from './test-utils'
import type { Application, CustomStage } from '@/db/schema'

const mockApplications: Application[] = [
  {
    id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
    timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
    createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
  },
]

const mockCustomStages: CustomStage[] = [
  { id: '1', name: 'Screening', color: 'bg-pink-100' },
]

vi.mock('@/hooks/useApplications', () => ({
  useApplications: vi.fn(),
  useCreateApplication: vi.fn(),
  useUpdateApplication: vi.fn(),
  useDeleteApplication: vi.fn(),
}))

vi.mock('@/hooks/useCustomStages', () => ({
  useCustomStages: vi.fn(),
  useAddCustomStage: vi.fn(() => ({ mutate: vi.fn() })),
  useRemoveCustomStage: vi.fn(() => ({ mutate: vi.fn() })),
}))

vi.mock('@/hooks/useStaleApplications', () => ({
  useStaleApplications: vi.fn(),
  useGhostedApplications: vi.fn(),
}))

vi.mock('@/hooks/useDuplicateDetection', () => ({
  useDuplicateDetection: vi.fn(() => null),
  useRepostedOffers: vi.fn(),
}))

import { useApplications, useCreateApplication, useDeleteApplication } from '@/hooks/useApplications'
import { useCustomStages } from '@/hooks/useCustomStages'
import { useStaleApplications, useGhostedApplications } from '@/hooks/useStaleApplications'
import { useRepostedOffers, useDuplicateDetection } from '@/hooks/useDuplicateDetection'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useApplications).mockReturnValue({ data: mockApplications, isLoading: false })
    vi.mocked(useCustomStages).mockReturnValue({ data: mockCustomStages })
    vi.mocked(useCreateApplication).mockReturnValue({ mutate: vi.fn() })
    vi.mocked(useStaleApplications).mockReturnValue([])
    vi.mocked(useGhostedApplications).mockReturnValue([])
    vi.mocked(useRepostedOffers).mockReturnValue([])
    vi.mocked(useDuplicateDetection).mockReturnValue(null)
  })

  it('renders header with title', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('Apply Log+')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    vi.mocked(useApplications).mockReturnValue({ data: [], isLoading: true })
    renderWithProviders(<App />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders application table with data', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Engineer')).toBeInTheDocument()
  })

  it('shows reposted warning banner', () => {
    vi.mocked(useRepostedOffers).mockReturnValue([[mockApplications[0], mockApplications[0]]])
    renderWithProviders(<App />)
    expect(screen.getByText(/Found 1 job postings/)).toBeInTheDocument()
  })

  it('shows stale warning banner', () => {
    vi.mocked(useStaleApplications).mockReturnValue([mockApplications[0]])
    renderWithProviders(<App />)
    expect(screen.getByText(/1 application\(s\) have not been updated/)).toBeInTheDocument()
  })

  it('shows ghosted warning banner', () => {
    vi.mocked(useGhostedApplications).mockReturnValue([mockApplications[0]])
    renderWithProviders(<App />)
    expect(screen.getByText(/1 application\(s\) have not heard back/)).toBeInTheDocument()
  })

  it('opens sync panel when sync button clicked', () => {
    renderWithProviders(<App />)
    const syncBtn = screen.getByText('Sync')
    fireEvent.click(syncBtn)
    expect(screen.getByText('Configuration')).toBeInTheDocument()
  })

  it('opens add dialog when Add button clicked', () => {
    renderWithProviders(<App />)
    const addBtn = screen.getByRole('button', { name: 'Add Application' })
    fireEvent.click(addBtn)
    const addApplicationTexts = screen.getAllByText('Add Application')
    expect(addApplicationTexts.length).toBeGreaterThanOrEqual(2)
  })

  it('opens edit dialog when edit is triggered', () => {
    renderWithProviders(<App />)
    const editBtn = screen.getAllByText('Edit Application')[0]
    fireEvent.click(editBtn)
    expect(screen.getByDisplayValue('Google')).toBeInTheDocument()
  })

  it('renders export buttons', () => {
    renderWithProviders(<App />)
    expect(screen.getByText('Export JSON')).toBeInTheDocument()
    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('opens manage stages dialog', () => {
    renderWithProviders(<App />)
    const manageBtn = screen.getByText('Manage Stages')
    fireEvent.click(manageBtn)
    const manageTexts = screen.getAllByText('Manage Stages')
    expect(manageTexts.length).toBeGreaterThanOrEqual(2)
  })

  it('handles delete via confirm dialog', async () => {
    const mockDelete = vi.fn()
    vi.mocked(useDeleteApplication).mockReturnValue({ mutate: mockDelete })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<App />)
    const deleteBtn = screen.getAllByText('Delete')[0]
    fireEvent.click(deleteBtn)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDelete).toHaveBeenCalledWith('1')

    confirmSpy.mockRestore()
  })

  it('cancels delete via confirm dialog', () => {
    const mockDelete = vi.fn()
    vi.mocked(useDeleteApplication).mockReturnValue({ mutate: mockDelete })
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderWithProviders(<App />)
    const deleteBtn = screen.getAllByText('Delete')[0]
    fireEvent.click(deleteBtn)

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })
})
