import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplications'
import { db } from '@/db/database'
import type { Application } from '@/db/schema'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const sampleApp: Omit<Application, 'id'> = {
  company: 'Google', role: 'Engineer', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
  createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
}

describe('useApplications', () => {
  beforeEach(async () => {
    await db.applications.clear()
  })

  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useApplications(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })

  it('returns applications from database', async () => {
    await db.applications.add(sampleApp as Application)

    const { result } = renderHook(() => useApplications(), { wrapper: createWrapper() })
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
      expect(result.current.data![0].company).toBe('Google')
    })
  })
})

describe('useCreateApplication', () => {
  beforeEach(async () => {
    await db.applications.clear()
  })

  it('creates an application', async () => {
    const { result } = renderHook(() => useCreateApplication(), { wrapper: createWrapper() })

    result.current.mutate(sampleApp as any)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const apps = await db.applications.toArray()
    expect(apps).toHaveLength(1)
    expect(apps[0].company).toBe('Google')
  })
})

describe('useUpdateApplication', () => {
  beforeEach(async () => {
    await db.applications.clear()
  })

  it('updates an application', async () => {
    const numId = await db.applications.add(sampleApp as Application)

    const { result } = renderHook(() => useUpdateApplication(), { wrapper: createWrapper() })

    result.current.mutate({
      id: numId,
      company: 'Google', role: 'Senior Engineer', currentStage: 'Interview',
      timeline: [{ stage: 'Applied', date: '2024-01-01T10:00:00Z' }],
      createdAt: '2024-01-01T10:00:00Z', updatedAt: '2024-01-01T10:00:00Z',
    } as any)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const apps = await db.applications.toArray()
    const app = apps.find(a => a.company === 'Google')
    expect(app?.role).toBe('Senior Engineer')
  })
})

describe('useDeleteApplication', () => {
  beforeEach(async () => {
    await db.applications.clear()
  })

  it('deletes an application', async () => {
    const numId = await db.applications.add(sampleApp as Application)

    const { result } = renderHook(() => useDeleteApplication(), { wrapper: createWrapper() })

    result.current.mutate(numId)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const apps = await db.applications.toArray()
    expect(apps).toHaveLength(0)
  })
})
