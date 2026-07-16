import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StageBadge } from '@/components/applications/StageBadge'

describe('StageBadge', () => {
  it('renders Applied stage with blue color', () => {
    render(<StageBadge stage="Applied" label="Applied" />)
    const badge = screen.getByText('Applied')
    expect(badge).toBeInTheDocument()
    expect(badge.className).toContain('bg-blue-100')
  })

  it('renders Rejected stage with red color', () => {
    render(<StageBadge stage="Rejected" label="Rejected" />)
    const badge = screen.getByText('Rejected')
    expect(badge.className).toContain('bg-red-100')
  })

  it('renders Ghosted stage with gray color', () => {
    render(<StageBadge stage="Ghosted" label="Ghosted" />)
    const badge = screen.getByText('Ghosted')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('renders custom stage with default color', () => {
    render(<StageBadge stage="Screening" label="Screening" />)
    const badge = screen.getByText('Screening')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('renders custom stage with custom color', () => {
    render(<StageBadge stage="Screening" label="Screening" customColor="bg-pink-100 text-pink-800" />)
    const badge = screen.getByText('Screening')
    expect(badge.className).toContain('bg-pink-100')
  })
})
