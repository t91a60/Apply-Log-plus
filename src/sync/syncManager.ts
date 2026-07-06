import { db } from '@/db/database'
import { encrypt, decrypt } from './encryption'
import { createGist, updateGist, readGist } from './gist'

const SYNC_CONFIG_KEY = 'syncConfig'

export interface SyncStorage {
  token: string
  gistId?: string
}

export interface SyncMeta {
  lastSyncedAt: string | null
  gistId: string | null
  token: string | null
}

async function setSyncMeta(meta: SyncMeta): Promise<void> {
  await db.table('meta').put({ key: SYNC_CONFIG_KEY, value: JSON.stringify(meta) }, SYNC_CONFIG_KEY)
}

export async function saveSyncConfig(storage: SyncStorage): Promise<void> {
  await db.table('meta').put({
    key: 'syncToken',
    value: storage.token,
  }, 'syncToken')

  if (storage.gistId) {
    await db.table('meta').put({
      key: 'gistId',
      value: storage.gistId,
    }, 'gistId')
  }

  await setSyncMeta({
    lastSyncedAt: null,
    gistId: storage.gistId ?? null,
    token: storage.token,
  })
}

export async function loadSyncStorage(): Promise<SyncStorage | null> {
  try {
    const tokenEntry = await db.table('meta').get('syncToken') as { value: string } | undefined
    if (!tokenEntry) return null
    const gistEntry = await db.table('meta').get('gistId') as { value: string } | undefined
    return {
      token: tokenEntry.value,
      gistId: gistEntry?.value,
    }
  } catch {
    return null
  }
}

export async function clearSyncConfig(): Promise<void> {
  await db.table('meta').bulkDelete(['syncToken', 'gistId', SYNC_CONFIG_KEY])
}

export async function pushToGist(password: string): Promise<void> {
  const storage = await loadSyncStorage()
  if (!storage?.token) throw new Error('Sync not configured')

  const applications = await db.applications.toArray()
  const customStages = await db.customStages.toArray()

  const payload = JSON.stringify({ applications, customStages })
  const encrypted = await encrypt(payload, password)

  if (storage.gistId) {
    await updateGist(storage.token, storage.gistId, [
      { filename: 'apply-log-plus-data.json', content: encrypted },
    ])
  } else {
    const gistId = await createGist(storage.token, [
      { filename: 'apply-log-plus-data.json', content: encrypted },
    ])
    await db.table('meta').put({ key: 'gistId', value: gistId }, 'gistId')
  }

  await setSyncMeta({
    lastSyncedAt: new Date().toISOString(),
    gistId: storage.gistId ?? null,
    token: storage.token,
  })
}

export async function pullFromGist(password: string): Promise<void> {
  const storage = await loadSyncStorage()
  if (!storage?.token || !storage.gistId) throw new Error('Sync not configured')

  const files = await readGist(storage.token, storage.gistId)
  const encrypted = files['apply-log-plus-data.json']
  if (!encrypted) throw new Error('No sync data found in Gist')

  const decrypted = await decrypt(encrypted, password)
  const data = JSON.parse(decrypted)

  if (data.applications) {
    await db.applications.clear()
    await db.applications.bulkAdd(data.applications)
  }

  if (data.customStages) {
    await db.customStages.clear()
    await db.customStages.bulkAdd(data.customStages)
  }

  await setSyncMeta({
    lastSyncedAt: new Date().toISOString(),
    gistId: storage.gistId,
    token: storage.token,
  })
}
