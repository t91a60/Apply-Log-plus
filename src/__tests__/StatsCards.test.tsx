import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { StatsCards } from '@/components/applications/StatsCards'
import type { Application } from '@/db/schema'
import { renderWithProviders } from './test-utils'

const baseApp: Application = {
  id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

describe('StatsCards', () => {
  it('renders zero stats with all labels', () => {
    renderWithProviders(<StatsCards applications={[]} />)
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    expect(screen.getByText('Offers')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(5)
  })

  it('renders total count correctly', () => {
    renderWithProviders(<StatsCards applications={[baseApp]} />)
    const numbers = screen.getAllByText('1')
    expect(numbers.length).toBeGreaterThanOrEqual(1)
  })

  it('counts active and rejected correctly', () => {
    const apps: Application[] = [
      { ...baseApp, id: '1', currentStage: 'Applied' },
      { ...baseApp, id: '2', currentStage: 'Rejected' },
      { ...baseApp, id: '3', currentStage: 'Interview' },
    ]
    renderWithProviders(<StatsCards applications={apps} />)
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThanOrEqual(1)
    const ones = screen.getAllByText('1')
    expect(ones.length).toBeGreaterThanOrEqual(1)
  })

  it('shows monthly trend chart when data exists', () => {
    const apps: Application[] = [
      { ...baseApp, id: '1', createdAt: '2024-01-01T10:00:00Z' },
      { ...baseApp, id: '2', createdAt: '2024-01-15T10:00:00Z' },
      { ...baseApp, id: '3', createdAt: '2024-02-01T10:00:00Z' },
    ]
    renderWithProviders(<StatsCards applications={apps} />)
    expect(screen.getByText('Monthly Trend')).toBeInTheDocument()
  })

  it('shows avg response time when apps have timeline entries', () => {
    const apps: Application[] = [
      {
        ...baseApp, id: '1',
        timeline: [
          { stage: 'Applied', date: '2024-01-01T10:00:00Z' },
          { stage: 'Interview', date: '2024-01-15T10:00:00Z' },
        ],
      },
    ]
    renderWithProviders(<StatsCards applications={apps} />)
    expect(screen.getByText('Avg. Response Time')).toBeInTheDocument()
  })

  it('hides avg response time when no apps have multi-entry timeline', () => {
    renderWithProviders(<StatsCards applications={[baseApp]} />)
    expect(screen.queryByText('Avg. Response Time')).not.toBeInTheDocument()
  })
})
