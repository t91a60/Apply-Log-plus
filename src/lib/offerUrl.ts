export function getOfferHref(value: string | undefined): string | undefined {
  if (!value || !/^https?:\/\//i.test(value)) return undefined
  try {
    const url = new URL(value)
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password) return url.href
  } catch {
    // Keep malformed historical values as text, never as links.
  }
  return undefined
}
