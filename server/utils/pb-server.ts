import PocketBase from 'pocketbase'
import { getHeader, createError, type H3Event } from 'h3'

export function createPocketBase() {
    const url = import.meta.dev ? 'http://localhost:8090' : 'http://pb:8080'
    return new PocketBase(url)
}

export function getAuthenticatedPb(event: H3Event) {
    const header = getHeader(event, 'authorization') || ''
    const token = header.replace(/^Bearer\s+/i, '').trim()

    if (!token) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required.',
        })
    }

    const pb = createPocketBase()
    pb.authStore.save(token, null)

    if (!pb.authStore.isValid) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid or expired session.',
        })
    }

    return pb
}

export async function requirePermission(event: H3Event, permission: string) {
    const pb = getAuthenticatedPb(event)

    const auth = await pb
        .collection('users')
        .authRefresh({ expand: 'role.permissions', requestKey: null })
        .catch(() => null)
    if (!auth) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Invalid or expired session.',
        })
    }

    const role = auth.record.expand?.role as
        | { name?: string; expand?: { permissions?: { name: string }[] } }
        | undefined
    const permitted =
        role?.name === 'admin' ||
        !!role?.expand?.permissions?.some((entry) => entry.name === permission)
    if (!permitted) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden.' })
    }

    return pb
}
