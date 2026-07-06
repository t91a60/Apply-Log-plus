import type { Application, CustomStage } from '@/db/schema'
import { defaultStageLabels } from '@/db/schema'

function stageLabel(stage: string, lang: 'en' | 'pl'): string {
  if (stage in defaultStageLabels) {
    return defaultStageLabels[stage as keyof typeof defaultStageLabels][lang]
  }
  return stage
}

export function exportToJson(applications: Application[], customStages: CustomStage[]): string {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    applications,
    customStages,
  }
  return JSON.stringify(data, null, 2)
}

export function exportToCsv(applications: Application[], lang: 'en' | 'pl'): string {
  const header = [
    'Company', 'Role', 'Stage', 'Location', 'Salary',
    'URL', 'Notes', 'Created', 'Updated',
  ].join(',')

  const rows = applications.map(app => {
    const stage = stageLabel(app.currentStage, lang)
    return [
      escapeCsv(app.company),
      escapeCsv(app.role),
      escapeCsv(stage),
      escapeCsv(app.location ?? ''),
      escapeCsv(app.salary ?? ''),
      escapeCsv(app.url ?? ''),
      escapeCsv(app.notes ?? ''),
      app.createdAt,
      app.updatedAt,
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
