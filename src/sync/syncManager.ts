import { db } from '@/db/database'
import { parseSnapshot, readLocalSnapshot, replaceLocalSnapshot } from '@/db/snapshot'
import { encrypt, decrypt } from './encryption'
import { createGist, updateGist, readGist, isGistId, MAX_GIST_BYTES } from './gist'

const LEGACY_SECRET_KEYS = ['syncToken', 'syncConfig', 'syncPassword']
export const MIN_NEW_PASSWORD_LENGTH = 16

export class SyncError extends Error {
  readonly reason: 'tooLarge' | 'invalidSnapshot' | 'localChanged' | 'shortPassword'
  constructor(reason: SyncError['reason']) {
    super(reason)
    this.reason = reason
  }
}

export async function removeLegacySyncSecrets() {
  await db.meta.bulkDelete(LEGACY_SECRET_KEYS)
}

export async function loadGistId(): Promise<string> {
  await removeLegacySyncSecrets()
  const value = (await db.meta.get('gistId'))?.value
  return isGistId(value) ? value : ''
}

export async function rememberGistId(gistId: string) {
  if (!isGistId(gistId)) throw new Error('Invalid Gist ID')
  await db.meta.put({ key: 'gistId', value: gistId })
}

export async function clearSyncConfig() {
  await db.meta.bulkDelete(['gistId', ...LEGACY_SECRET_KEYS])
}

export async function pushToGist(token: string, password: string, gistId?: string): Promise<string> {
  if (!token || !password || (gistId !== undefined && !isGistId(gistId))) throw new Error('Invalid sync settings')
  if (!gistId && password.trim().length < MIN_NEW_PASSWORD_LENGTH) throw new SyncError('shortPassword')
  const payload = JSON.stringify(await readLocalSnapshot())
  // The existing salt/nonce/tag layout adds 44 bytes before base64 encoding.
  if (4 * Math.ceil((new TextEncoder().encode(payload).length + 44) / 3) > MAX_GIST_BYTES) {
    throw new SyncError('tooLarge')
  }
  parseSnapshot(payload)
  const encrypted = await encrypt(payload, password)
  if (gistId) {
    await updateGist(token, gistId, encrypted, async previous => {
      await decryptSnapshot(previous, password)
    })
  } else {
    gistId = await createGist(token, encrypted)
  }
  await rememberGistId(gistId)
  return gistId
}

async function decryptSnapshot(encrypted: string, password: string) {
  try {
    return parseSnapshot(await decrypt(encrypted, password))
  } catch {
    throw new SyncError('invalidSnapshot')
  }
}

export async function pullFromGist(token: string, password: string, gistId: string): Promise<void> {
  if (!token || !password || !isGistId(gistId)) throw new Error('Invalid sync settings')
  const expectedLocal = JSON.stringify(await readLocalSnapshot())
  const encrypted = await readGist(token, gistId)
  const snapshot = await decryptSnapshot(encrypted, password)
  try {
    await replaceLocalSnapshot(snapshot, expectedLocal, gistId)
  } catch (error) {
    if (error instanceof Error && error.message === 'Local data changed during restore') {
      throw new SyncError('localChanged')
    }
    throw error
  }
}
