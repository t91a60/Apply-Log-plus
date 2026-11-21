import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export function offlineBuild(): Plugin {
  return {
    name: 'apply-log-offline',
    apply: 'build',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const hash = createHash('sha256')
        const publicFiles = ['favicon.svg', 'icons.svg']
        const files = [...Object.keys(bundle).sort(), ...publicFiles]
        for (const item of Object.values(bundle).sort((a, b) => a.fileName.localeCompare(b.fileName))) {
          hash.update(item.fileName).update(item.type === 'chunk' ? item.code : item.source)
        }
        for (const file of publicFiles) hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)))
        if (!files.includes('index.html')) throw new Error('Offline build is missing index.html')
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: `
const root = new URL(self.registration.scope);
const prefix = 'apply-log-plus:' + root.pathname + ':';
const cacheName = prefix + ${JSON.stringify(hash.digest('hex').slice(0, 20))};
const files = new Set(${JSON.stringify(files)}.map(file => new URL(file, root).href));
const index = new URL('index.html', root).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll([...files].map(url => new Request(url, { cache: 'reload' })))
  ));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== root.origin) return;
  const navigation = request.mode === 'navigate' &&
    (url.pathname === root.pathname || url.pathname === new URL(index).pathname);
  const key = navigation ? index : url.href;
  if (!files.has(key)) return;
  event.respondWith((async () => {
    if (navigation) {
      try {
        return await fetch(request, { cache: 'no-cache' });
      } catch {
        const cache = await caches.open(cacheName);
        return (await cache.match(index)) ?? Response.error();
      }
    }
    const cache = await caches.open(cacheName);
    return (await cache.match(key)) ?? fetch(request);
  })());
});
`,
        })
      },
    },
  }
}
