const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 600_000
const HASH = 'SHA-256'
const SALT_BYTES = 16
const IV_BYTES = 12
const TAG_BYTES = 16

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
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
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

  const parts: string[] = []
  for (let i = 0; i < combined.length; i += 0x4000) {
    parts.push(String.fromCharCode(...combined.subarray(i, i + 0x4000)))
  }
  return btoa(parts.join(''))
}

export async function decrypt(encryptedBase64: string, password: string): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))
  const headerLength = SALT_BYTES + IV_BYTES
  if (combined.length < headerLength + TAG_BYTES) throw new Error('Invalid encrypted backup')

  const salt = combined.subarray(0, SALT_BYTES)
  const iv = combined.subarray(SALT_BYTES, headerLength)
  const data = combined.subarray(headerLength)

  const key = await getKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as BufferSource },
    key,
    data,
  )

  return new TextDecoder('utf-8', { fatal: true }).decode(decrypted)
}
