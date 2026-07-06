import { z } from 'zod'

export const DefaultStages = [
  'Applied',
  'Phone Screen',
  'Interview',
  'Technical',
  'Offer',
  'Rejected',
  'Ghosted',
  'Accepted',
  'Declined',
] as const

export const StageEnum = z.enum(DefaultStages)
export type DefaultStage = z.infer<typeof StageEnum>

export type Stage = string

export const defaultStageLabels: Record<DefaultStage, { en: string; pl: string }> = {
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

export const CustomStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Stage name is required'),
  color: z.string().default('bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700'),
})

export type CustomStage = z.infer<typeof CustomStageSchema>

export const StageTimelineEntrySchema = z.object({
  stage: z.string(),
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
  currentStage: z.string(),
  timeline: z.array(StageTimelineEntrySchema),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Application = z.infer<typeof ApplicationSchema>
