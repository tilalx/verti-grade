import PocketBase from 'pocketbase'
import { getHeader, createError } from 'h3'

export function createPocketBase() {
    const url = import.meta.dev ? 'http://localhost:8090' : 'http://pb:8080'
    return new PocketBase(url)
}

/**
 * Build a PocketBase client authenticated as the requesting user.
 *
 * The user's auth token is forwarded from the `Authorization` header so that
 * every PocketBase request is evaluated against that user's collection rules,
 * instead of running as an anonymous client that could expose records the
 * caller is not allowed to read.
 *
 * Throws a 401 error when no valid token is present.
 */
export function getAuthenticatedPb(event) {
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
