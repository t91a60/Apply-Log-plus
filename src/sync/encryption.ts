const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 600_000
const HASH = 'SHA-256'

async function getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(data: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getKey(password, salt)

  const encoded = new TextEncoder().encode(data)
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    encoded,
  )

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const combined = new Uint8Array(
    atob(encryptedBase64).split('').map(c => c.charCodeAt(0)),
  )

  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const data = combined.slice(28)

  const key = await getKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    data,
  )

  return new TextDecoder().decode(decrypted)
}
