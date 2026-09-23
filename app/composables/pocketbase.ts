import PocketBase, { BaseAuthStore, type AuthRecord } from 'pocketbase'
import { AUTH_COOKIE } from '~/utils/clientStorage'

class CookieAuthStore extends BaseAuthStore {
    constructor() {
        super()
        this.loadFromCookie(document.cookie, AUTH_COOKIE)
    }

    override save(token: string, record?: AuthRecord) {
        super.save(token, record)
        this.#persist()
    }

    override clear() {
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

declare global {
    var _pb: PocketBase | undefined
}

export const usePocketbase = (): PocketBase => {
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

export const usePbFileUrl = (
    record: { id?: string; collectionId?: string } | null | undefined,
    filename: string | null | undefined,
    query?: Record<string, string>,
) => {
    if (!record?.id || !filename) return ''
    const base = import.meta.dev ? 'http://localhost:8090' : ''
    const q = query ? `?${new URLSearchParams(query)}` : ''
    return `${base}/api/files/${record.collectionId}/${record.id}/${filename}${q}`
}
