import PocketBase, { BaseAuthStore, type AuthRecord } from 'pocketbase'
import { AUTH_COOKIE, SESSION_ONLY_AUTH_COOKIE } from '~/utils/clientStorage'

class CookieAuthStore extends BaseAuthStore {
    persistent = !document.cookie
        .split('; ')
        .includes(`${SESSION_ONLY_AUTH_COOKIE}=1`)

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
        this.persistent = true
        this.#persist()
    }

    #persist() {
        const sessionOnly = !this.persistent && this.isValid
        document.cookie = this.exportToCookie(
            {
                httpOnly: false,
                secure: location.protocol === 'https:',
                sameSite: 'Lax',
                path: '/',
                ...(sessionOnly ? { expires: undefined } : {}),
            },
            AUTH_COOKIE,
        )
        document.cookie = `${SESSION_ONLY_AUTH_COOKIE}=1; Path=/; SameSite=Lax${sessionOnly ? '' : '; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'}`
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

export const setAuthPersistent = (persistent: boolean) => {
    const { authStore } = usePocketbase()
    if (authStore instanceof CookieAuthStore) authStore.persistent = persistent
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
