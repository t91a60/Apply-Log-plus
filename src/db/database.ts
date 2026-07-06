import Dexie, { type EntityTable } from 'dexie'
import type { Application } from './schema'

const db = new Dexie('ApplyLogPlus') as Dexie & {
  applications: EntityTable<Application, 'id'>
}

db.version(1).stores({
  applications: '++id, company, role, currentStage, createdAt, updatedAt',
})

export { db }
