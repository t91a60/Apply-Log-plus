import { describe, it, expect, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { Select } from '@/components/ui/select'
import { renderWithProviders } from './test-utils'

describe('Select', () => {
  it('uses a labelled native control and returns the selected value', () => {
    const onValueChange = vi.fn()
    renderWithProviders(
      <><label htmlFor="stage">Stage</label>
        <Select id="stage" defaultValue="Applied" onValueChange={onValueChange}>
          <option value="Applied">Applied</option><option value="Interview">Interview</option>
        </Select>
      </>,
    )
    const select = screen.getByRole('combobox', { name: 'Stage' })
    expect(select.tagName).toBe('SELECT')
    fireEvent.change(select, { target: { value: 'Interview' } })
    expect(onValueChange).toHaveBeenCalledWith('Interview')
    expect(select).toHaveValue('Interview')
  })
})
