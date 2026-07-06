import { describe, it, expect } from 'vitest'
import { generatePairingCode, decodePairingCode } from '@/sync/gist'

describe('pairing code', () => {
  it('generates and decodes a pairing code', () => {
    const config = {
      token: 'ghp_test123',
      gistId: 'abc123',
      password: 'mypassword',
    }

    const code = generatePairingCode(config)
    expect(code).toBeTruthy()
    expect(typeof code).toBe('string')

    const decoded = decodePairingCode(code)
    expect(decoded.token).toBe(config.token)
    expect(decoded.gistId).toBe(config.gistId)
    expect(decoded.password).toBe(config.password)
  })

  it('generates code without optional gistId', () => {
    const config = {
      token: 'ghp_test',
      gistId: undefined,
      password: 'pass',
    }

    const code = generatePairingCode(config)
    const decoded = decodePairingCode(code)
    expect(decoded.token).toBe(config.token)
    expect(decoded.gistId).toBeUndefined()
    expect(decoded.password).toBe(config.password)
  })

  it('throws on invalid code', () => {
    expect(() => decodePairingCode('invalid-base64!')).toThrow()
    expect(() => decodePairingCode('')).toThrow()
  })
})
