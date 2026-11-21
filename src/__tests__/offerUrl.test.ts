import { describe, expect, it } from 'vitest'
import { getOfferHref } from '@/lib/offerUrl'

describe('offer links', () => {
  it('allows saved HTTP and HTTPS addresses', () => {
    expect(getOfferHref('http://jobs.example.test/path')).toBe('http://jobs.example.test/path')
    expect(getOfferHref('https://jobs.example.test')).toBe('https://jobs.example.test/')
  })

  it.each([undefined, '', 'ftp://jobs.example.test', 'https://', 'https://user@jobs.example.test'])(
    'does not render an active link for %s',
    value => expect(getOfferHref(value)).toBeUndefined(),
  )
})
