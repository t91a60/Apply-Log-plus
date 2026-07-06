import { describe, it, expect } from 'vitest'
import { useDuplicateDetection, useRepostedOffers } from '@/hooks/useDuplicateDetection'
import type { Application } from '@/db/schema'
import { renderHook } from '@testing-library/react'

const baseApp: Application = {
  id: '1',
  company: 'Google',
  role: 'Software Engineer',
  currentStage: 'Applied',
  timeline: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const baseApp2: Application = {
  id: '2',
  company: 'google',
  role: 'software engineer ',
  currentStage: 'Applied',
  timeline: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

const baseApp3: Application = {
  id: '3',
  company: 'Meta',
  role: 'Engineer',
  currentStage: 'Applied',
  timeline: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

describe('useDuplicateDetection', () => {
  it('detects duplicate by normalized company+role', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp, baseApp3], 'Google', 'Software Engineer')
    )
    expect(result.current).not.toBeNull()
    expect(result.current!.id).toBe('1')
  })

  it('ignores case and whitespace when matching', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp], 'GOOGLE', '  Software Engineer  ')
    )
    expect(result.current).not.toBeNull()
  })

  it('returns null when no duplicate', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp], 'Apple', 'Designer')
    )
    expect(result.current).toBeNull()
  })

  it('excludes the given id from matching', () => {
    const { result } = renderHook(() =>
      useDuplicateDetection([baseApp, baseApp2], 'Google', 'Software Engineer', '1')
    )
    expect(result.current).not.toBeNull()
  })
})

describe('useRepostedOffers', () => {
  it('groups applications by company+role', () => {
    const { result } = renderHook(() =>
      useRepostedOffers([baseApp, baseApp2, baseApp3])
    )
    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toHaveLength(2)
  })

  it('returns empty when no duplicates', () => {
    const { result } = renderHook(() =>
      useRepostedOffers([baseApp, baseApp3])
    )
    expect(result.current).toHaveLength(0)
  })
})
