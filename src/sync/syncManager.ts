import { db } from '@/db/database'
import { encrypt, decrypt } from './encryption'
import { createGist, updateGist, readGist, type SyncConfig } from './gist'

const SYNC_CONFIG_KEY = 'syncConfig'

export interface SyncMeta {
  lastSyncedAt: string | null
  gistId: string | null
  token: string | null
}

async function setSyncMeta(meta: SyncMeta): Promise<void> {
  await db.table('meta').put({ key: SYNC_CONFIG_KEY, value: JSON.stringify(meta) }, SYNC_CONFIG_KEY)
}

export async function saveSyncConfig(config: SyncConfig): Promise<void> {
  await db.table('meta').put({
    key: 'syncToken',
    value: config.token,
  }, 'syncToken')

  if (config.gistId) {
    await db.table('meta').put({
      key: 'gistId',
      value: config.gistId,
    }, 'gistId')
  }

  await db.table('meta').put({
    key: 'syncPassword',
    value: config.password,
  }, 'syncPassword')

  await setSyncMeta({
    lastSyncedAt: null,
    gistId: config.gistId ?? null,
    token: config.token,
  })
}

export async function loadSyncConfig(): Promise<SyncConfig | null> {
  try {
    const token = await db.table('meta').get('syncToken') as { value: string } | undefined
    const gistId = await db.table('meta').get('gistId') as { value: string } | undefined
    const password = await db.table('meta').get('syncPassword') as { value: string } | undefined
    if (!token || !password) return null
    return {
      token: token.value,
      gistId: gistId?.value,
      password: password.value,
    }
  } catch {
    return null
  }
}

export async function clearSyncConfig(): Promise<void> {
  await db.table('meta').bulkDelete(['syncToken', 'gistId', 'syncPassword', SYNC_CONFIG_KEY])
}

export async function pushToGist(password: string): Promise<void> {
  const config = await loadSyncConfig()
  if (!config?.token) throw new Error('Sync not configured')

  const applications = await db.applications.toArray()
  const customStages = await db.customStages.toArray()

  const payload = JSON.stringify({ applications, customStages })
  const encrypted = await encrypt(payload, password)

  if (config.gistId) {
    await updateGist(config.token, config.gistId, [
      { filename: 'apply-log-plus-data.json', content: encrypted },
    ])
  } else {
    const gistId = await createGist(config.token, [
      { filename: 'apply-log-plus-data.json', content: encrypted },
    ])
    await db.table('meta').put({ key: 'gistId', value: gistId }, 'gistId')
  }

  await setSyncMeta({ lastSyncedAt: new Date().toISOString(), gistId: config.gistId ?? null, token: config.token })
}

export async function pullFromGist(password: string): Promise<void> {
  const config = await loadSyncConfig()
  if (!config?.token || !config.gistId) throw new Error('Sync not configured')

  const files = await readGist(config.token, config.gistId)
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

  await setSyncMeta({ lastSyncedAt: new Date().toISOString(), gistId: config.gistId, token: config.token })
}
