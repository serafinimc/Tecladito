const BUILD_ID = '__TECLADITO_BUILD_ID__'
const PRECACHE_URLS = __TECLADITO_PRECACHE_MANIFEST__
const CACHE_PREFIX = 'tecladito-precache-'
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`
const PRECACHE_BATCH_SIZE = 8

const cachePreloadBatch = async (cache, urls) => {
  await Promise.all(urls.map(async (url) => {
    if (await cache.match(url)) return

    const response = await fetch(new Request(url, { cache: 'reload' }))
    if (!response.ok) throw new Error(`No se pudo precachear ${url}: HTTP ${response.status}`)
    await cache.put(url, response)
  }))
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)

    for (let index = 0; index < PRECACHE_URLS.length; index += PRECACHE_BATCH_SIZE) {
      await cachePreloadBatch(cache, PRECACHE_URLS.slice(index, index + PRECACHE_BATCH_SIZE))
    }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(
      names
        .filter((name) => name !== CACHE_NAME && (name.startsWith(CACHE_PREFIX) || name.startsWith('tecladito-')))
        .map((name) => caches.delete(name)),
    )
    await self.clients.claim()
  })())
})

const rangeNotSatisfiable = (size) => new Response(null, {
  status: 416,
  headers: {
    'Accept-Ranges': 'bytes',
    'Content-Range': `bytes */${size}`,
  },
})

const createRangeResponse = async (request, response) => {
  const rangeHeader = request.headers.get('range')
  const body = await response.arrayBuffer()
  const size = body.byteLength
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader ?? '')

  if (!match || (!match[1] && !match[2])) return rangeNotSatisfiable(size)

  let start
  let end

  if (!match[1]) {
    const suffixLength = Number(match[2])
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return rangeNotSatisfiable(size)
    start = Math.max(size - suffixLength, 0)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] ? Number(match[2]) : size - 1
  }

  if (
    size === 0
    || !Number.isSafeInteger(start)
    || !Number.isSafeInteger(end)
    || start < 0
    || start >= size
    || end < start
  ) return rangeNotSatisfiable(size)

  end = Math.min(end, size - 1)
  const headers = new Headers(response.headers)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Length', String(end - start + 1))
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)

  return new Response(body.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers,
  })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)

    if (request.mode === 'navigate') {
      const appShell = await cache.match('/index.html')
      return appShell ?? fetch(request)
    }

    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) {
      return request.headers.has('range') ? createRangeResponse(request, cached) : cached
    }

    return fetch(request)
  })())
})
