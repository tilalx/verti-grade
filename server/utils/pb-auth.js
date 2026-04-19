import { getHeader, createError } from 'h3'
import { createPocketBase } from './pb-server.js'

function decodeJwtPayload(token) {
    try {
        return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    } catch {
        return null
    }
}

/**
 * Create a PocketBase client, optionally authenticated as the calling user.
 * Reads the auth token from (in priority order):
 *   1. Authorization: Bearer <token> header (PocketBase JS SDK uses localStorage)
 *   2. pb_auth cookie (fallback for cookie-based setups)
 * Decodes the JWT payload to populate authStore.record.
 * Throws 401 only if `require` is true and no valid token is found.
 */
export function createAuthedPocketBase(event, { require: requireAuth = true } = {}) {
    const pb = createPocketBase()

    let token = null
    const authHeader = getHeader(event, 'authorization') ?? ''
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7)
    } else {
        const cookieHeader = getHeader(event, 'cookie') ?? ''
        pb.authStore.loadFromCookie(cookieHeader)
        token = pb.authStore.token || null
    }

    if (token) {
        const payload = decodeJwtPayload(token)
        pb.authStore.save(token, payload ?? null)
    }

    if (requireAuth && !pb.authStore.isValid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    return pb
}
