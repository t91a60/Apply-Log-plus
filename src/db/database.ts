import Dexie, { type EntityTable } from 'dexie'
import type { Application } from './schema'
import type { CustomStage } from './schema'

type Metadata = { key: string; value: string }

const db = new Dexie('ApplyLogPlus') as Dexie & {
  applications: EntityTable<Application, 'id'>
  customStages: EntityTable<CustomStage, 'id'>
  meta: EntityTable<Metadata, 'key'>
}

db.version(3).stores({
  applications: '++id, company, role, currentStage, createdAt, updatedAt',
  customStages: '++id, name',
  meta: 'key',
})

export { db }
