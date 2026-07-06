import { describe, it, expect } from 'vitest'
import { DefaultStages, CustomStageSchema, ApplicationSchema } from '@/db/schema'

describe('DefaultStages', () => {
  it('contains all expected stages', () => {
    expect(DefaultStages).toContain('Applied')
    expect(DefaultStages).toContain('Interview')
    expect(DefaultStages).toContain('Offer')
    expect(DefaultStages).toContain('Rejected')
    expect(DefaultStages).toContain('Ghosted')
  })
})

describe('CustomStageSchema', () => {
  it('validates a custom stage', () => {
    const result = CustomStageSchema.parse({ name: 'Screening Call' })
    expect(result.name).toBe('Screening Call')
    expect(result.color).toBeTruthy()
  })

  it('rejects empty name', () => {
    expect(() => CustomStageSchema.parse({ name: '' })).toThrow()
  })
})

describe('ApplicationSchema', () => {
  it('validates a minimal application', () => {
    const result = ApplicationSchema.parse({
      company: 'Test Corp',
      role: 'Engineer',
      currentStage: 'Applied',
      timeline: [{ stage: 'Applied', date: '2024-01-01' }],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    })
    expect(result.company).toBe('Test Corp')
    expect(result.role).toBe('Engineer')
  })

  it('rejects empty company', () => {
    expect(() =>
      ApplicationSchema.parse({
        company: '',
        role: 'Engineer',
        currentStage: 'Applied',
        timeline: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      })
    ).toThrow()
  })

  it('rejects empty role', () => {
    expect(() =>
      ApplicationSchema.parse({
        company: 'Test Corp',
        role: '',
        currentStage: 'Applied',
        timeline: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      })
    ).toThrow()
  })

  it('accepts custom stage values', () => {
    const result = ApplicationSchema.parse({
      company: 'Test Corp',
      role: 'Engineer',
      currentStage: 'My Custom Stage',
      timeline: [{ stage: 'My Custom Stage', date: '2024-01-01' }],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    })
    expect(result.currentStage).toBe('My Custom Stage')
  })

  it('accepts optional fields', () => {
    const result = ApplicationSchema.parse({
      company: 'Test Corp',
      role: 'Engineer',
      url: '',
      location: 'Remote',
      salary: '100k',
      notes: 'Great company',
      currentStage: 'Offer',
      timeline: [{ stage: 'Applied', date: '2024-01-01' }, { stage: 'Interview', date: '2024-01-15' }],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-20',
    })
    expect(result.location).toBe('Remote')
    expect(result.salary).toBe('100k')
    expect(result.notes).toBe('Great company')
    expect(result.timeline).toHaveLength(2)
  })
})
