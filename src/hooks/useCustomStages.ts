import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db/database'
import { CustomStageSchema, DefaultStages, type CustomStage, type RecordId } from '@/db/schema'

const CUSTOM_STAGES_KEY = ['customStages'] as const

async function fetchCustomStages(): Promise<CustomStage[]> {
  return db.customStages.toArray()
}

async function addCustomStage(data: { name: string; color?: string }) {
  const stage = CustomStageSchema.parse({ ...data, name: data.name.trim() })
  const name = stage.name.toLowerCase()
  return db.transaction('rw', db.customStages, async () => {
    const stages = await db.customStages.toArray()
    if (DefaultStages.some(item => item.toLowerCase() === name) || stages.some(item => item.name.toLowerCase() === name)) {
      throw new Error('Duplicate stage')
    }
    const id = await db.customStages.add(stage)
    return { ...stage, id }
  })
}

async function removeCustomStage(id: RecordId) {
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
