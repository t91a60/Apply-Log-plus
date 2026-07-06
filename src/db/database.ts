import Dexie, { type EntityTable } from 'dexie'
import type { Application } from './schema'
import type { CustomStage } from './schema'

const db = new Dexie('ApplyLogPlus') as Dexie & {
  applications: EntityTable<Application, 'id'>
  customStages: EntityTable<CustomStage, 'id'>
}

db.version(3).stores({
  applications: '++id, company, role, currentStage, createdAt, updatedAt',
  customStages: '++id, name',
  meta: 'key',
})

export { db }
