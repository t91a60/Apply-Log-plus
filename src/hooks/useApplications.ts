import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db/database'
import { ApplicationSchema, type Application, type RecordId } from '@/db/schema'

const APPLICATIONS_KEY = ['applications'] as const

async function fetchApplications(): Promise<Application[]> {
  return db.applications.orderBy('createdAt').reverse().toArray()
}

async function fetchApplication(id: RecordId): Promise<Application | undefined> {
  return db.applications.get(id)
}

async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> & { id?: RecordId; createdAt?: string; updatedAt?: string }) {
  const now = new Date().toISOString()
  const app = ApplicationSchema.parse({
    ...data,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  })
  const id = await db.applications.add(app)
  return { ...app, id }
}

async function updateApplication(data: Application) {
  const now = new Date().toISOString()
  const app = ApplicationSchema.parse({ ...data, updatedAt: now })
  if (app.id === undefined || await db.applications.update(app.id, app) !== 1) {
    throw new Error('Application no longer exists')
  }
  return app
}

async function deleteApplication(id: RecordId) {
  await db.applications.delete(id)
  return id
}

export function useApplications() {
  return useQuery({
    queryKey: APPLICATIONS_KEY,
    queryFn: fetchApplications,
  })
}

export function useApplication(id: RecordId) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, id],
    queryFn: () => fetchApplication(id),
    enabled: !!id,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}
