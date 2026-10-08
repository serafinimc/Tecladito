const CACHE_PREFIX = 'tecladito-precache-'
const CACHE_NAME = `${CACHE_PREFIX}__TECLADITO_BUILD_ID__`
const LEGACY_CACHE_NAMES = new Set(['tecladito-v1', 'tecladito-v2'])
const PRECACHE_URLS = /* __TECLADITO_PRECACHE_MANIFEST__ */ []
const PRECACHE_PATHS = new Set(PRECACHE_URLS.map((url) => new URL(url, self.location.origin).pathname))
const SHOULD_CLAIM_CLIENTS = !self.registration.active

const precacheApp = async () => {
  const cache = await caches.open(CACHE_NAME)

  try {
    const requests = PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))
    await cache.addAll(requests)
  } catch (error) {
    await caches.delete(CACHE_NAME)
    throw error
  }
}

const createRangeResponse = async (request, response) => {
  const rangeHeader = request.headers.get('range')
  if (rangeHeader === null) return response

  const bytes = await response.arrayBuffer()
  const rangeNotSatisfiable = () => new Response(null, {
    status: 416,
    headers: { 'Content-Range': `bytes */${bytes.byteLength}` },
  })
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader)
  if (!match) return rangeNotSatisfiable()

  const [, startText, endText] = match
  if (!startText && !endText) return rangeNotSatisfiable()

  const suffixLength = Number(endText)
  if (!startText && suffixLength === 0) return rangeNotSatisfiable()

  let start = startText ? Number(startText) : Math.max(0, bytes.byteLength - suffixLength)
  let end = endText && startText ? Number(endText) : bytes.byteLength - 1
  end = Math.min(end, bytes.byteLength - 1)

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= bytes.byteLength) {
    return rangeNotSatisfiable()
  }

  const headers = new Headers(response.headers)
  headers.delete('Content-Encoding')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Length', String(end - start + 1))
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`)

  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers,
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheApp())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => {
        const previousCaches = names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        const previousCache = previousCaches[previousCaches.length - 1]
        const cachesToDelete = names.filter((name) => (
          (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME && name !== previousCache)
          || (previousCache && LEGACY_CACHE_NAMES.has(name))
        ))
        return Promise.all(cachesToDelete.map((name) => caches.delete(name)))
      })
      .then(() => SHOULD_CLAIM_CLIENTS ? self.clients.claim() : undefined),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (request.mode !== 'navigate' && !PRECACHE_PATHS.has(url.pathname)) return

  const serveRequest = async () => {
    if (request.mode === 'navigate') {
      try {
        const cache = await caches.open(CACHE_NAME)
        const cachedIndex = await cache.match('/index.html')
        if (cachedIndex) return cachedIndex
      } catch {
        // Cache Storage can be unavailable or evicted; online navigation must still work.
      }
      return fetch(request)
    }

    try {
      const cache = await caches.open(CACHE_NAME)
      const isAudio = url.pathname.startsWith('/audio/characters/')
      const cacheKey = isAudio ? url.pathname : request
      const cached = await cache.match(cacheKey)
      if (cached) return isAudio ? await createRangeResponse(request, cached) : cached
    } catch {
      // Fall through to the network when a cached response cannot be read.
    }

    return fetch(request)
  }

  event.respondWith(serveRequest())
})
