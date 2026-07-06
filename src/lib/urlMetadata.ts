export interface UrlMetadata {
  title: string | null
  description: string | null
  siteName: string | null
}

export interface UrlMetadataResult {
  success: boolean
  data: UrlMetadata
}

const CORS_PROXY = 'https://api.allorigins.win/raw?url='

export async function fetchUrlMetadata(url: string): Promise<UrlMetadataResult> {
  try {
    const proxyUrl = CORS_PROXY + encodeURIComponent(url)
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'ApplyLogPlus/1.0' },
    })

    if (!response.ok) {
      return { success: false, data: { title: null, description: null, siteName: null } }
    }

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const title = getMetaContent(doc, 'og:title')
      ?? doc.querySelector('title')?.textContent
      ?? null

    const description = getMetaContent(doc, 'og:description')
      ?? getMetaContent(doc, 'description')
      ?? null

    const siteName = getMetaContent(doc, 'og:site_name')
      ?? null

    const data: UrlMetadata = {
      title: title?.trim() ?? null,
      description: description?.trim() ?? null,
      siteName: siteName?.trim() ?? null,
    }

    return { success: true, data }
  } catch {
    return { success: false, data: { title: null, description: null, siteName: null } }
  }
}

function getMetaContent(doc: Document, property: string): string | null {
  const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
  return el?.getAttribute('content') ?? null
}
