export interface UrlMetadata {
  title: string | null
  description: string | null
  siteName: string | null
  company: string | null
  companyLogo: string | null
  image: string | null
  salary: string | null
  location: string | null
}

export interface UrlMetadataResult {
  success: boolean
  data: UrlMetadata
}

const PROXIES = [
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
]

export async function fetchUrlMetadata(url: string): Promise<UrlMetadataResult> {
  for (const buildProxyUrl of PROXIES) {
    try {
      const response = await fetch(buildProxyUrl(url), {
        headers: { 'User-Agent': 'ApplyLogPlus/1.0' },
      })

      if (!response.ok) continue

      const html = await response.text()
      if (!html) continue

      const doc = new DOMParser().parseFromString(html, 'text/html')

      const jsonLd = parseJsonLd(doc)
      const ogTitle = getMetaContent(doc, 'og:title')
        ?? doc.querySelector('title')?.textContent
        ?? null
      const ogDescription = getMetaContent(doc, 'og:description')
        ?? getMetaContent(doc, 'description')
        ?? null
      const ogSiteName = getMetaContent(doc, 'og:site_name')
        ?? null
      const ogImage = getMetaContent(doc, 'og:image')
        ?? null

      return {
        success: true,
        data: {
          title: (jsonLd?.title ?? ogTitle)?.trim() ?? null,
          description: ogDescription?.trim() ?? null,
          siteName: ogSiteName?.trim() ?? null,
          company: jsonLd?.company?.trim() ?? null,
          companyLogo: jsonLd?.companyLogo?.trim() ?? null,
          image: (jsonLd?.image ?? ogImage)?.trim() ?? null,
          salary: jsonLd?.salary ?? null,
          location: jsonLd?.location?.trim() ?? null,
        },
      }
    } catch {
      continue
    }
  }

  return {
    success: false,
    data: {
      title: null, description: null, siteName: null,
      company: null, companyLogo: null, image: null,
      salary: null, location: null,
    },
  }
}

function getMetaContent(doc: Document, property: string): string | null {
  const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
  return el?.getAttribute('content') ?? null
}

interface JsonLdJobPosting {
  title: string | null
  company: string | null
  companyLogo: string | null
  image: string | null
  salary: string | null
  location: string | null
}

function parseJsonLd(doc: Document): JsonLdJobPosting | null {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const raw = JSON.parse(script.textContent ?? '')
      const job = findJobPosting(raw)
      if (!job) continue

      const title = extractString(job, 'title') ?? null
      const company = extractNestedString(job, ['hiringOrganization', 'name']) ?? null
      const companyLogo = extractNestedString(job, ['hiringOrganization', 'logo']) ?? null
      const image = extractString(job, 'image') ?? null
      const salary = buildSalaryString(job)
      const location = buildLocationString(job)

      return { title, company, companyLogo, image, salary, location }
    } catch {
      continue
    }
  }
  return null
}

function findJobPosting(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  if (getType(obj) === 'JobPosting') return obj

  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) {
      if (item && typeof item === 'object' && getType(item as Record<string, unknown>) === 'JobPosting') {
        return item as Record<string, unknown>
      }
    }
  }

  if (Array.isArray(obj['@type'])) {
    const types = obj['@type'] as string[]
    if (types.includes('JobPosting')) return obj
  }

  return null
}

function getType(obj: Record<string, unknown>): string | null {
  const t = obj['@type']
  if (typeof t === 'string') return t
  return null
}

function extractString(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key]
  if (typeof val === 'string' && val.length > 0) return val
  return null
}

function extractNestedString(obj: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = obj
  for (const key of path) {
    if (!current || typeof current !== 'object') return null
    current = (current as Record<string, unknown>)[key]
  }
  if (typeof current === 'string' && current.length > 0) return current
  return null
}

function buildSalaryString(job: Record<string, unknown>): string | null {
  const bs = job['baseSalary']
  if (!bs || typeof bs !== 'object') return null
  const salary = bs as Record<string, unknown>

  const currency = extractString(salary, 'currency')
  const minVal = extractNestedString(salary, ['value', 'minValue'])
  const maxVal = extractNestedString(salary, ['value', 'maxValue'])

  if (!minVal && !maxVal) return null

  const fmt = (v: string) => {
    const n = parseFloat(v)
    if (isNaN(n)) return v
    return Math.round(n).toLocaleString('pl-PL')
  }

  const parts: string[] = []
  if (minVal && maxVal) {
    parts.push(`${fmt(minVal)} – ${fmt(maxVal)}`)
  } else if (minVal) {
    parts.push(`od ${fmt(minVal)}`)
  } else if (maxVal) {
    parts.push(`do ${fmt(maxVal)}`)
  }

  if (currency) parts.push(currency)
  if (parts.length === 0) return null

  return parts.join(' ')
}

function buildLocationString(job: Record<string, unknown>): string | null {
  const addr = extractNestedString(job, ['jobLocation', 'address', 'addressLocality'])
  if (addr) return addr

  const fullAddr = job['jobLocation'] as Record<string, unknown> | undefined
  const addrObj = fullAddr?.['address'] as Record<string, unknown> | undefined
  if (addrObj && typeof addrObj === 'object') {
    const parts: string[] = []
    for (const key of ['addressLocality', 'addressRegion', 'addressCountry']) {
      const val = extractString(addrObj, key)
      if (val) parts.push(val)
    }
    if (parts.length > 0) return parts.join(', ')
  }

  return null
}
