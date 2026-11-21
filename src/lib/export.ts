import type { Application, CustomStage } from '@/db/schema'
import { getStageLabel } from '@/db/schema'

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
    const stage = getStageLabel(app.currentStage, lang)
    return [
      escapeCsv(app.company),
      escapeCsv(app.role),
      escapeCsv(stage),
      escapeCsv(app.location ?? ''),
      escapeCsv(app.salary ?? ''),
      escapeCsv(app.url ?? ''),
      escapeCsv(app.notes ?? ''),
      escapeCsv(app.createdAt),
      escapeCsv(app.updatedAt),
    ].join(',')
  })

  return [header, ...rows].join('\n')
}

function escapeCsv(value: string): string {
  const formulaLike = /^[\t\r\n]|^[\s\u200b-\u200d]*[=+\-@＝＋－＠]/u.test(value)
  const literal = formulaLike ? `'${value}` : value
  if (formulaLike || /[,"\r\n]/.test(literal)) {
    return `"${literal.replace(/"/g, '""')}"`
  }
  return literal
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
