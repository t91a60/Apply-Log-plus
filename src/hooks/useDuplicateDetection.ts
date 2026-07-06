import { useMemo } from 'react'
import type { Application } from '@/db/schema'

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export function useDuplicateDetection(
  applications: Application[],
  company: string,
  role: string,
  excludeId?: string,
) {
  return useMemo(() => {
    if (!company.trim() || !role.trim()) return null

    const normalizedCompany = normalize(company)
    const normalizedRole = normalize(role)

    const duplicate = applications.find(app => {
      if (excludeId && app.id === excludeId) return false
      return (
        normalize(app.company) === normalizedCompany &&
        normalize(app.role) === normalizedRole
      )
    })

    return duplicate ?? null
  }, [applications, company, role, excludeId])
}

export function useRepostedOffers(applications: Application[]): Application[][] {
  return useMemo(() => {
    const groups = new Map<string, Application[]>()

    for (const app of applications) {
      const key = `${normalize(app.company)}|${normalize(app.role)}`
      const group = groups.get(key) ?? []
      group.push(app)
      groups.set(key, group)
    }

    return Array.from(groups.values()).filter(g => g.length > 1)
  }, [applications])
}
