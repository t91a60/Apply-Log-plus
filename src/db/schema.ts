import { z } from 'zod'

export const StageEnum = z.enum([
  'Applied',
  'Phone Screen',
  'Interview',
  'Technical',
  'Offer',
  'Rejected',
  'Ghosted',
  'Accepted',
  'Declined',
])

export type Stage = z.infer<typeof StageEnum>

export const stageLabels: Record<Stage, { en: string; pl: string }> = {
  Applied: { en: 'Applied', pl: 'Aplikowano' },
  'Phone Screen': { en: 'Phone Screen', pl: 'Rozmowa tel.' },
  Interview: { en: 'Interview', pl: 'Rozmowa' },
  Technical: { en: 'Technical', pl: 'Techniczne' },
  Offer: { en: 'Offer', pl: 'Oferta' },
  Rejected: { en: 'Rejected', pl: 'Odrzucono' },
  Ghosted: { en: 'Ghosted', pl: 'Ghosted' },
  Accepted: { en: 'Accepted', pl: 'Przyjęto' },
  Declined: { en: 'Declined', pl: 'Odrzucono przez Ciebie' },
}

export const StageTimelineEntrySchema = z.object({
  stage: StageEnum,
  date: z.string(),
  note: z.string().optional(),
})

export type StageTimelineEntry = z.infer<typeof StageTimelineEntrySchema>

export const ApplicationSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  salary: z.string().optional(),
  currentStage: StageEnum,
  timeline: z.array(StageTimelineEntrySchema),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Application = z.infer<typeof ApplicationSchema>
