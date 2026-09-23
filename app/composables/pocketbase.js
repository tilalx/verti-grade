import PocketBase, { BaseAuthStore } from 'pocketbase'
import { AUTH_COOKIE } from '~/utils/clientStorage'

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

export const usePbFileUrl = (record, filename, query) => {
    if (!record?.id || !filename) return ''
    const base = import.meta.dev ? 'http://localhost:8090' : ''
    const q = query ? `?${new URLSearchParams(query)}` : ''
    return `${base}/api/files/${record.collectionId}/${record.id}/${filename}${q}`
}
