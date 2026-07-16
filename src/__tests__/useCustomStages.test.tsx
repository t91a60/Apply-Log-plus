import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useCustomStages, useAddCustomStage, useRemoveCustomStage } from '@/hooks/useCustomStages'
import { db } from '@/db/database'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCustomStages', () => {
  beforeEach(async () => {
    await db.customStages.clear()
  })

  it('returns empty array initially', async () => {
    const { result } = renderHook(() => useCustomStages(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([])
  })
})

describe('useAddCustomStage', () => {
  beforeEach(async () => {
    await db.customStages.clear()
  })

  it('adds a custom stage', async () => {
    const { result } = renderHook(() => useAddCustomStage(), { wrapper: createWrapper() })

    result.current.mutate({ name: 'Screening' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const stages = await db.customStages.toArray()
    expect(stages).toHaveLength(1)
    expect(stages[0].name).toBe('Screening')
  })
})

describe('useRemoveCustomStage', () => {
  beforeEach(async () => {
    await db.customStages.clear()
  })

  it('removes a custom stage', async () => {
    const numId = await db.customStages.add({ name: 'Screening' })

    const { result } = renderHook(() => useRemoveCustomStage(), { wrapper: createWrapper() })

    result.current.mutate(numId)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const stages = await db.customStages.toArray()
    expect(stages).toHaveLength(0)
  })
})
