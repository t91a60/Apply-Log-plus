import { describe, it, expect } from 'vitest'
import { exportToJson, exportToCsv } from '@/lib/export'
import type { Application, CustomStage } from '@/db/schema'

const apps: Application[] = [
  {
    id: '1',
    company: 'Google',
    role: 'Engineer',
    currentStage: 'Applied',
    timeline: [{ stage: 'Applied', date: '2024-01-01' }],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    url: 'https://google.com/jobs',
    location: 'Warsaw',
    salary: '200k',
    notes: 'Dream job',
  },
  {
    id: '2',
    company: 'Meta, Inc.',
    role: 'Designer',
    currentStage: 'Rejected',
    timeline: [{ stage: 'Applied', date: '2024-02-01' }],
    createdAt: '2024-02-01',
    updatedAt: '2024-02-10',
    notes: 'Contains "comma"',
  },
]

const customStages: CustomStage[] = [
  { id: '1', name: 'Screening', color: 'bg-blue-100' },
]

describe('exportToJson', () => {
  it('exports applications and custom stages', () => {
    const json = exportToJson(apps, customStages)
    const data = JSON.parse(json)
    expect(data.applications).toHaveLength(2)
    expect(data.customStages).toHaveLength(1)
    expect(data.version).toBe('1.0')
    expect(data.exportedAt).toBeTruthy()
  })
})

describe('exportToCsv', () => {
  it('exports applications with header and rows', () => {
    const csv = exportToCsv(apps, 'en')
    const lines = csv.split('\n')
    expect(lines[0]).toBe('Company,Role,Stage,Location,Salary,URL,Notes,Created,Updated')
    expect(lines).toHaveLength(3)
  })

  it('escapes commas in fields', () => {
    const csv = exportToCsv(apps, 'en')
    expect(csv).toContain('"Meta, Inc."')
  })

  it('uses localized stage labels', () => {
    const csv = exportToCsv(apps, 'pl')
    expect(csv).toContain('Aplikowano')
    expect(csv).toContain('Odrzucono')
  })
})
