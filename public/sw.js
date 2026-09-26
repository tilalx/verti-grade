const CACHE = `verti-grade-${new URL(self.location.href).searchParams.get('build')}`
const OFFLINE_URL = '/offline.html'

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
