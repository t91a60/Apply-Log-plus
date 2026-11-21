const API = 'https://api.github.com/gists'
const FILENAME = 'apply-log-plus-data.json'
export const MAX_GIST_BYTES = 1_000_000

export function isGistId(id: unknown): id is string {
  return typeof id === 'string' && /^[0-9a-f]{1,64}$/i.test(id)
}

async function apiRequest(token: string, id?: string, method = 'GET', body?: object) {
  if (id !== undefined && !isGistId(id)) throw new Error('Invalid Gist ID')
  const response = await fetch(id ? `${API}/${id}` : API, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Gist request failed (${response.status})`)
  return response
}

function filesFor(content: string) {
  if (content.length > MAX_GIST_BYTES) throw new Error('Encrypted backup is too large for Gist')
  return { [FILENAME]: { content } }
}

export async function createGist(token: string, content: string): Promise<string> {
  const response = await apiRequest(token, undefined, 'POST', {
    public: false,
    description: 'Apply Log+ encrypted snapshot',
    files: filesFor(content),
  })
  const result = await response.json()
  if (!isGistId(result?.id)) throw new Error('Invalid Gist response')
  return result.id
}

export async function updateGist(
  token: string, id: string, content: string, validatePrevious: (previous: string) => Promise<void>,
): Promise<void> {
  const files = filesFor(content)
  // Refuse to overwrite an unrelated or public Gist, even if the token can edit it.
  await validatePrevious(await readGist(token, id))
  await apiRequest(token, id, 'PATCH', { files })
}

export async function readGist(token: string, id: string): Promise<string> {
  const response = await apiRequest(token, id)
  const result = await response.json()
  const file = result?.files?.[FILENAME]
  if (result?.public !== false || !file || file.truncated || typeof file.content !== 'string' ||
      !file.content || file.content.length > MAX_GIST_BYTES) {
    throw new Error('Missing, public, or incomplete Gist snapshot')
  }
  return file.content
}
