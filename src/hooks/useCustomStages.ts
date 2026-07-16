import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db/database'
import type { CustomStage } from '@/db/schema'

const CUSTOM_STAGES_KEY = ['customStages'] as const

async function fetchCustomStages(): Promise<CustomStage[]> {
  return db.customStages.toArray()
}

async function addCustomStage(data: { name: string; color?: string }) {
  const stage: CustomStage = {
    name: data.name,
    color: data.color ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
  }
  const id = await db.customStages.add(stage)
  return { ...stage, id: String(id) }
}

async function removeCustomStage(id: string) {
  await db.customStages.delete(id)
  return id
}

export function useCustomStages() {
  return useQuery({
    queryKey: CUSTOM_STAGES_KEY,
    queryFn: fetchCustomStages,
  })
}

export function useAddCustomStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addCustomStage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_STAGES_KEY })
    },
  })
}

export function useRemoveCustomStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCustomStage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_STAGES_KEY })
    },
  })
}
