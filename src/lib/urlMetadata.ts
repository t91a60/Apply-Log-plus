export interface UrlMetadata {
  title: string | null
  description: string | null
  siteName: string | null
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

      const title = getMetaContent(doc, 'og:title')
        ?? doc.querySelector('title')?.textContent
        ?? null

      const description = getMetaContent(doc, 'og:description')
        ?? getMetaContent(doc, 'description')
        ?? null

      const siteName = getMetaContent(doc, 'og:site_name')
        ?? null

      return {
        success: true,
        data: {
          title: title?.trim() ?? null,
          description: description?.trim() ?? null,
          siteName: siteName?.trim() ?? null,
        },
      }
    } catch {
      continue
    }
  }

  return { success: false, data: { title: null, description: null, siteName: null } }
}

function getMetaContent(doc: Document, property: string): string | null {
  const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
  return el?.getAttribute('content') ?? null
}
