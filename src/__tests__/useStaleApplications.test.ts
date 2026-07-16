import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useStaleApplications, useGhostedApplications } from '@/hooks/useStaleApplications'
import type { Application } from '@/db/schema'

const baseApp: Application = {
  id: '1', company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: new Date().toISOString(),
}

describe('useStaleApplications', () => {
  it('returns empty when all apps are recent', () => {
    const { result } = renderHook(() => useStaleApplications([baseApp]))
    expect(result.current).toHaveLength(0)
  })

  it('returns stale apps (no update in 14 days)', () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const staleApp: Application = { ...baseApp, id: '2', updatedAt: oldDate }
    const { result } = renderHook(() => useStaleApplications([staleApp]))
    expect(result.current).toHaveLength(1)
  })

  it('ignores rejected/ghosted/declined/accepted apps', () => {
    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const rejected: Application = { ...baseApp, id: '2', currentStage: 'Rejected', updatedAt: oldDate }
    const { result } = renderHook(() => useStaleApplications([rejected]))
    expect(result.current).toHaveLength(0)
  })
})

describe('useGhostedApplications', () => {
  it('returns empty when all apps are recent', () => {
    const { result } = renderHook(() => useGhostedApplications([baseApp]))
    expect(result.current).toHaveLength(0)
  })

  it('returns ghosted apps (no update in 30 days)', () => {
    const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const ghostedApp: Application = { ...baseApp, id: '2', updatedAt: oldDate }
    const { result } = renderHook(() => useGhostedApplications([ghostedApp]))
    expect(result.current).toHaveLength(1)
  })

  it('excludes apps already marked as Ghosted', () => {
    const oldDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
    const alreadyGhosted: Application = { ...baseApp, id: '2', currentStage: 'Ghosted', updatedAt: oldDate }
    const { result } = renderHook(() => useGhostedApplications([alreadyGhosted]))
    expect(result.current).toHaveLength(0)
  })
})
