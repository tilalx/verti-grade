import { createError, eventHandler, getRouterParam, readBody } from 'h3'
import { validateChallenge } from 'capjs-core'
import { buildRedeemToken, capSecret, isCapScope } from '../../../utils/cap'

/**
 * Checks the solved challenge and mints the token PocketBase will accept.
 *
 * `consumeNonce` always returns true: this process keeps no store, and spending
 * is enforced once, in PocketBase, against the same signature (see
 * server/utils/cap.ts). It is used here only to capture that signature.
 */
export default eventHandler(async (event) => {
    const secret = capSecret()
    if (!secret) {
        throw createError({
            statusCode: 503,
            statusMessage: 'Captcha is not configured.',
        })
    }

    const scope = getRouterParam(event, 'scope')
    if (!isCapScope(scope)) {
        throw createError({ statusCode: 404, statusMessage: 'Unknown scope.' })
    }

    const body = await readBody(event)

    let signature = ''
    const result = await validateChallenge(
        secret,
        {
            token: body?.token,
            solutions: body?.solutions,
            instr: body?.instr,
        },
        {
            scope,
            consumeNonce: (signatureHex: string) => {
                signature = signatureHex
                return true
            },
        },
    )

    if (!result.success) {
        // The widget only needs to know it has to start over; the reason is
        // for the operator's log, not for whoever is probing the endpoint.
        console.warn('cap: challenge rejected:', result.reason)
        throw createError({
            statusCode: 400,
            statusMessage: 'Challenge rejected.',
        })
    }

    // `success` is part of the contract the widget checks before it hands the
    // token to the form -- without it a perfectly good solution comes back as
    // "invalid_solution" on the client.
    return { success: true, ...buildRedeemToken(secret, scope, signature) }
})
