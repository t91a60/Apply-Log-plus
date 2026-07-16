import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDuplicateDetection, useRepostedOffers } from '@/hooks/useDuplicateDetection'
import type { Application } from '@/db/schema'

const baseApp: Application = {
  id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

describe('useDuplicateDetection', () => {
  it('returns null when company/role empty', () => {
    const { result } = renderHook(() => useDuplicateDetection([], '', ''))
    expect(result.current).toBeNull()
  })

  it('returns null when no match', () => {
    const { result } = renderHook(() => useDuplicateDetection([baseApp], 'Meta', 'Designer'))
    expect(result.current).toBeNull()
  })

  it('detects duplicate by company+role', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp], 'Google', 'Engineer')
    )
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('1')
  })

  it('ignores case and whitespace', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp], '  google  ', '  engineer  ')
    )
    expect(result.current).not.toBeNull()
  })

  it('excludes app by id', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp], 'Google', 'Engineer', '1')
    )
    expect(result.current).toBeNull()
  })
})

describe('useRepostedOffers', () => {
  it('returns empty when no duplicates', () => {
    const { result } = renderHook(() => useRepostedOffers([baseApp]))
    expect(result.current).toHaveLength(0)
  })

  it('groups duplicate applications', () => {
    const apps: Application[] = [
      baseApp,
      { ...baseApp, id: '2' },
      { ...baseApp, id: '3', company: 'Meta', role: 'Designer' },
    ]
    const { result } = renderHook(() => useRepostedOffers(apps))
    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toHaveLength(2)
  })
})
