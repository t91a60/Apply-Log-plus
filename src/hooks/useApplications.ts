import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/db/database'
import type { Application } from '@/db/schema'

const APPLICATIONS_KEY = ['applications'] as const

async function fetchApplications(): Promise<Application[]> {
  return db.applications.orderBy('createdAt').reverse().toArray()
}

async function fetchApplication(id: string): Promise<Application | undefined> {
  return db.applications.get(id)
}

async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string; updatedAt?: string }) {
  const now = new Date().toISOString()
  const app: Omit<Application, 'id'> & { id?: string } = {
    ...data,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  }
  const id = await db.applications.add(app as Application)
  return { ...app, id: String(id) } as Application
}

async function updateApplication(data: Application) {
  const now = new Date().toISOString()
  await db.applications.update(data.id!, {
    ...data,
    updatedAt: now,
  })
  return data
}

async function deleteApplication(id: string) {
  await db.applications.delete(id)
  return id
}

export function useApplications() {
  return useQuery({
    queryKey: APPLICATIONS_KEY,
    queryFn: fetchApplications,
  })
}

export function useApplication(id: string) {
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
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY })
    },
  })
}
