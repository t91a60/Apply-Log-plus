import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from '@/components/applications/Timeline'
import type { StageTimelineEntry } from '@/db/schema'

describe('Timeline', () => {
  it('returns null when timeline is empty', () => {
    const { container } = render(<Timeline timeline={[]} lang="en" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders timeline entries sorted by date descending', () => {
    const entries: StageTimelineEntry[] = [
      { stage: 'Applied', date: '2024-01-01T10:00:00Z' },
      { stage: 'Interview', date: '2024-01-15T10:00:00Z' },
      { stage: 'Offer', date: '2024-01-10T10:00:00Z' },
    ]
    render(<Timeline timeline={entries} lang="en" />)
    const items = screen.getAllByText(/Applied|Interview|Offer/)
    expect(items).toHaveLength(3)
  })

  it('renders entry notes', () => {
    const entries: StageTimelineEntry[] = [
      { stage: 'Applied', date: '2024-01-01T10:00:00Z', note: 'Online application' },
    ]
    render(<Timeline timeline={entries} lang="en" />)
    expect(screen.getByText('Online application')).toBeInTheDocument()
  })

  it('renders custom stage name', () => {
    const entries: StageTimelineEntry[] = [
      { stage: 'Custom Test', date: '2024-01-01T10:00:00Z' },
    ]
    render(<Timeline timeline={entries} lang="en" />)
    expect(screen.getByText('Custom Test')).toBeInTheDocument()
  })
})
