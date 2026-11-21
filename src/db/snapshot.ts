import { z } from 'zod'
import { db } from './database'
import { ApplicationSchema, CustomStageSchema, RecordIdSchema, StageTimelineEntrySchema } from './schema'

const date = z.string().refine(value => Number.isFinite(Date.parse(value)))
const SnapshotSchema = z.object({
  applications: z.array(ApplicationSchema.extend({
    id: RecordIdSchema,
    createdAt: date,
    updatedAt: date,
    timeline: z.array(StageTimelineEntrySchema.extend({ date })),
  })),
  customStages: z.array(CustomStageSchema.extend({ id: RecordIdSchema })),
})

export type Snapshot = z.infer<typeof SnapshotSchema>
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024

export function parseSnapshot(json: string): Snapshot {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new Error('Invalid backup format')
  }
  const result = SnapshotSchema.safeParse(raw)
  if (!result.success) throw new Error('Invalid backup format')
  for (const records of [result.data.applications, result.data.customStages]) {
    if (new Set(records.map(record => record.id)).size !== records.length) {
      throw new Error('Duplicate IDs in backup')
    }
  }
  return result.data
}

async function readTables() {
  const [applications, customStages] = await Promise.all([db.applications.toArray(), db.customStages.toArray()])
  return { applications, customStages }
}

export function readLocalSnapshot() {
  return db.transaction('r', db.applications, db.customStages, readTables)
}

export async function replaceLocalSnapshot(snapshot: Snapshot, expectedLocal?: string, gistId?: string) {
  await db.transaction('rw', db.applications, db.customStages, db.meta, async () => {
    if (expectedLocal !== undefined && JSON.stringify(await readTables()) !== expectedLocal) {
      throw new Error('Local data changed during restore')
    }
    await db.applications.clear()
    await db.customStages.clear()
    await db.applications.bulkAdd(snapshot.applications)
    await db.customStages.bulkAdd(snapshot.customStages)
    if (gistId) await db.meta.put({ key: 'gistId', value: gistId })
  })
}
