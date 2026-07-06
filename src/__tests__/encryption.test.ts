import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/sync/encryption'

describe('encryption', () => {
  it('encrypts and decrypts data with a password', async () => {
    const original = 'Hello, World! This is sensitive data.'
    const password = 'MyStrongPassword123!'

    const encrypted = await encrypt(original, password)
    expect(encrypted).not.toBe(original)
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/)

    const decrypted = await decrypt(encrypted, password)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertexts for the same plaintext', async () => {
    const original = 'Test data'
    const password = 'password'

    const e1 = await encrypt(original, password)
    const e2 = await encrypt(original, password)
    expect(e1).not.toBe(e2)
  })

  it('fails with wrong password', async () => {
    const original = 'Secret'
    const encrypted = await encrypt(original, 'correct password')

    await expect(decrypt(encrypted, 'wrong password')).rejects.toThrow()
  })
})
