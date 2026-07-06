export interface UrlMetadata {
  title: string | null
  description: string | null
  siteName: string | null
}

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      headers: { 'User-Agent': 'ApplyLogPlus/1.0' },
    })

    if (!response.ok) {
      return { title: null, description: null, siteName: null }
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

    return {
      title: title?.trim() ?? null,
      description: description?.trim() ?? null,
      siteName: siteName?.trim() ?? null,
    }
  } catch {
    return { title: null, description: null, siteName: null }
  }
}

function getMetaContent(doc: Document, property: string): string | null {
  const el = doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
  return el?.getAttribute('content') ?? null
}
