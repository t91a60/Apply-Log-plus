import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db/database'
import { saveSyncConfig, loadSyncStorage, clearSyncConfig } from '@/sync/syncManager'

beforeEach(async () => {
  await db.table('meta').clear()
})

describe('syncManager password isolation', () => {
  it('does not store password in meta table', async () => {
    await saveSyncConfig({ token: 'ghp_test', gistId: 'abc123' })

    const allMeta = await db.table('meta').toArray()
    const keys = allMeta.map((entry: { key: string }) => entry.key)

    expect(keys).not.toContain('syncPassword')
  })

  it('loadSyncStorage returns only token and gistId', async () => {
    await saveSyncConfig({ token: 'ghp_test', gistId: 'abc123' })

    const storage = await loadSyncStorage()
    expect(storage).not.toBeNull()
    expect(storage!.token).toBe('ghp_test')
    expect(storage!.gistId).toBe('abc123')
    expect((storage as { password?: string }).password).toBeUndefined()
  })

  it('returns null when no token is stored', async () => {
    const storage = await loadSyncStorage()
    expect(storage).toBeNull()
  })

  it('clearSyncConfig removes token and gistId', async () => {
    await saveSyncConfig({ token: 'ghp_test' })
    await clearSyncConfig()

    const storage = await loadSyncStorage()
    expect(storage).toBeNull()
  })
})
