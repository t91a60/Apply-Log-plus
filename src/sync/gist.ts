const GIST_API = 'https://api.github.com/gists'

export interface GistFile {
  filename: string
  content: string
}

export interface SyncConfig {
  token: string
  gistId?: string
  password: string
}

export async function createGist(token: string, files: GistFile[]): Promise<string> {
  const fileMap: Record<string, { content: string }> = {}
  for (const f of files) {
    fileMap[f.filename] = { content: f.content }
  }

  const res = await fetch(GIST_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ApplyLogPlus',
    },
    body: JSON.stringify({
      description: 'Apply Log+ sync data',
      public: false,
      files: fileMap,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gist creation failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.id as string
}

export async function updateGist(token: string, gistId: string, files: GistFile[]): Promise<void> {
  const fileMap: Record<string, { content: string }> = {}
  for (const f of files) {
    fileMap[f.filename] = { content: f.content }
  }

  const res = await fetch(`${GIST_API}/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ApplyLogPlus',
    },
    body: JSON.stringify({ files: fileMap }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gist update failed: ${res.status} ${err}`)
  }
}

export async function readGist(token: string, gistId: string): Promise<Record<string, string>> {
  const res = await fetch(`${GIST_API}/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ApplyLogPlus',
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gist read failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  const files: Record<string, string> = {}
  for (const [name, file] of Object.entries(data.files as Record<string, { content: string }>)) {
    files[name] = file.content
  }

  return files
}

export function generatePairingCode(config: SyncConfig): string {
  const payload = JSON.stringify({
    t: config.token,
    g: config.gistId,
    p: config.password,
  })
  return btoa(payload)
}

export function decodePairingCode(code: string): SyncConfig {
  try {
    const payload = JSON.parse(atob(code))
    return {
      token: payload.t,
      gistId: payload.g,
      password: payload.p,
    }
  } catch {
    throw new Error('Invalid pairing code')
  }
}
