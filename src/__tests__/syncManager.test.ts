import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/database'
import { parseSnapshot, readLocalSnapshot, replaceLocalSnapshot } from '@/db/snapshot'
import { decrypt, encrypt } from '@/sync/encryption'
import { clearSyncConfig, loadGistId, pullFromGist, pushToGist } from '@/sync/syncManager'

const gistId = 'abc123'
const password = 'test password only'
const token = 'test token only'
const fileName = 'apply-log-plus-data.json'
const date = '2026-01-01T00:00:00.000Z'
const app = { id: 1, company: 'Local', role: 'Tester', currentStage: 'Applied',
  timeline: [{ stage: 'Applied', date }], createdAt: date, updatedAt: date }
const replacement = { applications: [{ ...app, id: 'old-string-id', company: 'Remote' }],
  customStages: [{ id: 2, name: 'Screening', color: 'default' }] }

async function responseFor(data: unknown) {
  return Response.json({ public: false, files: {
    [fileName]: { content: await encrypt(JSON.stringify(data), password) },
  } })
}

beforeEach(async () => {
  await Promise.all([db.meta.clear(), db.applications.clear(), db.customStages.clear()])
  await db.applications.add(app)
  await db.customStages.add({ id: 1, name: 'Local stage', color: 'default' })
})
afterEach(() => vi.unstubAllGlobals())

describe('snapshot sync', () => {
  it('forgets older credentials but retains Gist ID and records', async () => {
    await db.meta.bulkPut([
      { key: 'syncToken', value: token }, { key: 'syncConfig', value: JSON.stringify({ token }) },
      { key: 'syncPassword', value: password }, { key: 'gistId', value: gistId },
    ])
    expect(await loadGistId()).toBe(gistId)
    expect(await db.meta.toArray()).toEqual([{ key: 'gistId', value: gistId }])
    await clearSyncConfig()
    expect(await loadGistId()).toBe('')
    expect(await db.applications.get(1)).toEqual(app)
  })

  it('pushes encrypted records with numeric IDs and remembers only the returned Gist ID', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: gistId }))
    vi.stubGlobal('fetch', fetch)
    expect(await pushToGist(token, password)).toBe(gistId)
    const body = fetch.mock.calls[0][1].body
    expect(body).not.toContain('Local')
    const content = JSON.parse(body).files[fileName].content
    expect(JSON.parse(await decrypt(content, password))).toEqual(await readLocalSnapshot())
    expect(await db.meta.toArray()).toEqual([{ key: 'gistId', value: gistId }])
  })

  it('does not send a newly created snapshot with a short passphrase', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(pushToGist(token, 'short')).rejects.toMatchObject({ reason: 'shortPassword' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('replaces both tables, preserves legacy string keys, and stores the ID', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(await responseFor(replacement)))
    await pullFromGist(token, password, gistId)
    expect(await readLocalSnapshot()).toEqual(replacement)
    expect(await loadGistId()).toBe(gistId)
  })

  it('leaves both tables unchanged on malformed, authenticated data', async () => {
    const before = await readLocalSnapshot()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(await responseFor({ applications: [] })))
    await expect(pullFromGist(token, password, gistId)).rejects.toMatchObject({ reason: 'invalidSnapshot' })
    expect(await readLocalSnapshot()).toEqual(before)
  })

  it('will not overwrite an existing snapshot using a different password', async () => {
    const fetch = vi.fn().mockResolvedValue(await responseFor(replacement))
    vi.stubGlobal('fetch', fetch)
    await expect(pushToGist(token, 'another password', gistId)).rejects.toMatchObject({ reason: 'invalidSnapshot' })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch.mock.calls[0][1].method).toBe('GET')
  })

  it('updates the previous snapshot with the same password', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(await responseFor(replacement))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    await expect(pushToGist(token, password, gistId)).resolves.toBe(gistId)
    expect(fetch.mock.calls[1][1].method).toBe('PATCH')
  })

  it('does not discard an edit made while downloading', async () => {
    const response = await responseFor(replacement)
    vi.stubGlobal('fetch', vi.fn(async () => {
      await db.applications.update(1, { notes: 'New local note' })
      return response
    }))
    await expect(pullFromGist(token, password, gistId)).rejects.toMatchObject({ reason: 'localChanged' })
    expect((await db.applications.get(1))?.notes).toBe('New local note')
  })

  it('rejects duplicated keys and invalid dates on validation', () => {
    expect(() => parseSnapshot(JSON.stringify({ applications: [app, app], customStages: [] }))).toThrow('Duplicate IDs')
    expect(() => parseSnapshot(JSON.stringify({ applications: [{ ...app, updatedAt: 'no date' }], customStages: [] }))).toThrow()
  })

  it('rolls back both clears and all writes if a write fails', async () => {
    const before = await readLocalSnapshot()
    const failure = vi.spyOn(db.customStages, 'bulkAdd').mockRejectedValueOnce(new Error('write failed'))
    try {
      await expect(replaceLocalSnapshot(replacement)).rejects.toThrow('write failed')
      expect(await readLocalSnapshot()).toEqual(before)
    } finally {
      failure.mockRestore()
    }
  })
})
