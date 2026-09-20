import PocketBase, { BaseAuthStore } from 'pocketbase'

const AUTH_COOKIE = 'pb_auth'

// Auth lives in a cookie, not localStorage, so the server can read it during
// SSR — that's what lets the navbar render logged-in on the first paint.
// httpOnly is necessarily false (the SDK writes it from JS), which is no
// weaker than the localStorage it replaces; nothing authenticates off the
// cookie either, PocketBase only accepts the Authorization header.
class CookieAuthStore extends BaseAuthStore {
    constructor() {
        super()
        this.loadFromCookie(document.cookie, AUTH_COOKIE)
    }

    save(token, record) {
        super.save(token, record)
        this.#persist()
    }

    clear() {
        super.clear()
        this.#persist()
    }

    // exportToCookie derives Expires from the token itself (epoch 0 once
    // cleared) and trims the record if it would blow the 4KB cookie limit.
    #persist() {
        document.cookie = this.exportToCookie(
            {
                httpOnly: false,
                secure: location.protocol === 'https:',
                sameSite: 'Lax',
                path: '/',
            },
            AUTH_COOKIE,
        )
    }
}

export const usePocketbase = () => {
    if (import.meta.server) {
        const url = import.meta.dev
            ? 'http://localhost:8090'
            : 'http://localhost:8080'
        const pb = new PocketBase(url)
        pb.authStore.loadFromCookie(
            useRequestHeaders(['cookie']).cookie ?? '',
            AUTH_COOKIE,
        )
        return pb
    }

    if (!globalThis._pb) {
        const url = import.meta.dev ? 'http://localhost:8090' : '/'
        globalThis._pb = new PocketBase(url, new CookieAuthStore())
    }

    return globalThis._pb
}

// Browser-facing file URL. pb.files.getURL() can't be used during SSR: the
// server instance points at PocketBase's internal host, which the browser
// can't reach.
export const usePbFileUrl = (record, filename, query) => {
    if (!record?.id || !filename) return ''
    const base = import.meta.dev ? 'http://localhost:8090' : ''
    const q = query ? `?${new URLSearchParams(query)}` : ''
    return `${base}/api/files/${record.collectionId}/${record.id}/${filename}${q}`
}
