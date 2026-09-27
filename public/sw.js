const CACHE = `gripello-${new URL(self.location.href).searchParams.get('build')}`
const OFFLINE_URL = '/offline.html'
const MAP_PAGE = '/map'
const MAP_DATA =
    /^\/api\/collections\/(walls|locations|averageRating)\/records$/
const NETWORK_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) =>
                cache.addAll([OFFLINE_URL, '/icon-192.png', '/icon-512.png']),
            )
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => key !== CACHE)
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return

    if (request.mode === 'navigate' && url.pathname === MAP_PAGE) {
        event.respondWith(
            networkFirst(request).then(
                async (response) =>
                    response ||
                    (await caches.match(OFFLINE_URL)) ||
                    new Response('Offline', { status: 503 }),
            ),
        )
        return
    }

    if (MAP_DATA.test(url.pathname)) {
        event.respondWith(
            networkFirst(request).then(
                (response) =>
                    response || new Response('Offline', { status: 503 }),
            ),
        )
        return
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(
                async () =>
                    (await caches.match(OFFLINE_URL)) ||
                    new Response('Offline', { status: 503 }),
            ),
        )
        return
    }

    if (
        url.pathname.startsWith('/_nuxt/') &&
        !url.pathname.startsWith('/_nuxt/builds/')
    ) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const copy = response.clone()
                            caches
                                .open(CACHE)
                                .then((cache) => cache.put(request, copy))
                                .catch(() => {})
                        }
                        return response
                    }),
            ),
        )
    }
})

function networkFirst(request) {
    return new Promise((resolve) => {
        let settled = false
        const settle = (response) => {
            if (settled) return
            settled = true
            resolve(response)
        }
        const cached = () => caches.match(request)
        const timer = setTimeout(async () => {
            const response = await cached()
            if (response) settle(response)
        }, NETWORK_TIMEOUT_MS)

        fetch(request)
            .then((response) => {
                clearTimeout(timer)
                if (response.ok) {
                    const copy = response.clone()
                    caches
                        .open(CACHE)
                        .then((cache) => cache.put(request, copy))
                        .catch(() => {})
                }
                settle(response)
            })
            .catch(async () => {
                clearTimeout(timer)
                settle((await cached()) || null)
            })
    })
}
