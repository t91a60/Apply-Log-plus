import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchUrlMetadata } from '@/lib/urlMetadata'

const mockHtml = (body: string) =>
  `<!DOCTYPE html><html><head>${body}</head><body></body></html>`

beforeEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fetchUrlMetadata', () => {
  it('parses JSON-LD JobPosting with all fields', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Senior Frontend Developer',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Tech Corp',
        logo: 'https://example.com/logo.png',
      },
      image: 'https://example.com/og-image.jpg',
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'PLN',
        value: {
          '@type': 'QuantitativeValue',
          minValue: '14800',
          maxValue: '17900',
        },
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Warsaw',
          addressRegion: 'Mazowieckie',
        },
      },
    })

    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/job')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Senior Frontend Developer')
    expect(result.data.company).toBe('Tech Corp')
    expect(result.data.companyLogo).toBe('https://example.com/logo.png')
    expect(result.data.image).toBe('https://example.com/og-image.jpg')
    expect(result.data.salary).toMatch(/14\s800 – 17\s900 PLN/)
    expect(result.data.location).toBe('Warsaw')
  })

  it('falls back to OG tags when JSON-LD is absent', async () => {
    const html = mockHtml(`
      <meta property="og:title" content="OG Job Title" />
      <meta property="og:description" content="Some description" />
      <meta property="og:site_name" content="ExamplePortal" />
      <meta property="og:image" content="https://example.com/og.jpg" />
      <title>Fallback Title</title>
    `)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/offer')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('OG Job Title')
    expect(result.data.siteName).toBe('ExamplePortal')
    expect(result.data.image).toBe('https://example.com/og.jpg')
    expect(result.data.company).toBeNull()
    expect(result.data.companyLogo).toBeNull()
    expect(result.data.salary).toBeNull()
    expect(result.data.location).toBeNull()
  })

  it('falls back to <title> when og:title is missing', async () => {
    const html = mockHtml('<title>Page Title Only</title>')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Page Title Only')
  })

  it('handles bad JSON-LD gracefully (falls through to OG)', async () => {
    const html = mockHtml(`
      <script type="application/ld+json">{invalid json}</script>
      <meta property="og:title" content="OG After Bad JSON" />
    `)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/bad')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('OG After Bad JSON')
  })

  it('handles JSON-LD without JobPosting (falls through to OG)', async () => {
    const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Something' })
    const html = mockHtml(`
      <script type="application/ld+json">${jsonLd}</script>
      <meta property="og:title" content="OG Title" />
    `)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/other')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('OG Title')
  })

  it('handles JobPosting with @graph wrapper', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Portal' },
        {
          '@type': 'JobPosting',
          title: 'Graph Job',
          hiringOrganization: { name: 'GraphCorp' },
          jobLocation: { address: { addressLocality: 'Krakow' } },
        },
      ],
    })
    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/graph')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Graph Job')
    expect(result.data.company).toBe('GraphCorp')
    expect(result.data.location).toBe('Krakow')
  })

  it('handles JobPosting with @type as array', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': ['JobPosting', 'Thing'],
      title: 'Array Type Job',
    })
    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/array')
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Array Type Job')
  })

  it('builds salary string with only minValue', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Min Salary Job',
      baseSalary: {
        currency: 'USD',
        value: { minValue: '50000' },
      },
    })
    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/min-salary')
    expect(result.success).toBe(true)
    expect(result.data.salary).toMatch(/od 50\s000 USD/)
  })

  it('returns null salary when baseSalary has no min/max', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'No Salary',
      baseSalary: { currency: 'PLN', value: {} },
    })
    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/no-salary')
    expect(result.success).toBe(true)
    expect(result.data.salary).toBeNull()
  })

  it('builds full address when addressLocality is missing', async () => {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Remote',
      jobLocation: {
        address: {
          addressRegion: 'Mazowieckie',
          addressCountry: 'PL',
        },
      },
    })
    const html = mockHtml(`<script type="application/ld+json">${jsonLd}</script>`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    }))

    const result = await fetchUrlMetadata('https://example.com/remote')
    expect(result.success).toBe(true)
    expect(result.data.location).toBe('Mazowieckie, PL')
  })

  it('returns success:false on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const result = await fetchUrlMetadata('https://example.com/fail')
    expect(result.success).toBe(false)
    expect(result.data.title).toBeNull()
    expect(result.data.company).toBeNull()
  })
})
