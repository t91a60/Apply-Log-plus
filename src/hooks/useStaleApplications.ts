import { useMemo } from 'react'
import type { Application } from '@/db/schema'

const STALE_DAYS = 14

export function useStaleApplications(applications: Application[]): Application[] {
  return useMemo(() => {
    const now = Date.now()
    const cutoff = STALE_DAYS * 24 * 60 * 60 * 1000

    return applications.filter(app => {
      const active = !['Rejected', 'Ghosted', 'Declined', 'Accepted'].includes(app.currentStage)
      if (!active) return false

      const lastUpdate = new Date(app.updatedAt).getTime()
      return (now - lastUpdate) > cutoff
    })
  }, [applications])
}

export function useGhostedApplications(applications: Application[]): Application[] {
  return useMemo(() => {
    const now = Date.now()
    const cutoff = 30 * 24 * 60 * 60 * 1000

    return applications.filter(app => {
      if (app.currentStage === 'Ghosted') return false
      const active = !['Rejected', 'Accepted', 'Declined'].includes(app.currentStage)
      if (!active) return false

      const lastUpdate = new Date(app.updatedAt).getTime()
      return (now - lastUpdate) > cutoff
    })
  }, [applications])
}
