import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGist, MAX_GIST_BYTES, readGist, updateGist } from '@/sync/gist'

const fileName = 'apply-log-plus-data.json'
afterEach(() => vi.unstubAllGlobals())

describe('Gist API', () => {
  it('creates an unlisted snapshot and keeps the credential in the authorization header', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: 'abc123' }))
    vi.stubGlobal('fetch', fetch)
    await expect(createGist('token', 'encrypted')).resolves.toBe('abc123')
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe('https://api.github.com/gists')
    expect(options).toMatchObject({ credentials: 'omit', redirect: 'error', headers: { Authorization: 'Bearer token' } })
    expect(JSON.parse(options.body)).toMatchObject({ public: false, files: { [fileName]: { content: 'encrypted' } } })
    expect(options.body).not.toContain('token')
  })

  it('updates only after checking the target is an existing unlisted snapshot', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json({ public: false, files: { [fileName]: { content: 'previous' } } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    const verify = vi.fn()
    await updateGist('token', 'abc123', 'next', verify)
    expect(verify).toHaveBeenCalledWith('previous')
    expect(fetch.mock.calls.map(([, options]) => options.method)).toEqual(['GET', 'PATCH'])
  })

  it.each([
    { public: true, files: { [fileName]: { content: 'encrypted' } } },
    { public: false, files: { [fileName]: { content: 'partial', truncated: true } } },
    { public: false, files: {} },
  ])('rejects public, truncated, or unrelated snapshots', async payload => {
    const fetch = vi.fn().mockResolvedValue(Response.json(payload))
    vi.stubGlobal('fetch', fetch)
    await expect(updateGist('token', 'abc123', 'new snapshot', vi.fn())).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid identifiers and oversized writes before making a request', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(readGist('token', 'not-an-id')).rejects.toThrow('Invalid Gist ID')
    await expect(createGist('token', 'x'.repeat(MAX_GIST_BYTES + 1))).rejects.toThrow('too large')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not expose an upstream error body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('server response body', { status: 403 })))
    await expect(readGist('token', 'abc')).rejects.toThrow(/^Gist request failed \(403\)$/)
  })
})
