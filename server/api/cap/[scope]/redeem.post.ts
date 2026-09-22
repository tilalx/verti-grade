import { createError, eventHandler, getRouterParam, readBody } from 'h3'
import { validateChallenge } from 'capjs-core'
import { buildRedeemToken, capSecret, isCapScope } from '../../../utils/cap'

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
        console.warn('cap: challenge rejected:', result.reason)
        throw createError({
            statusCode: 400,
            statusMessage: 'Challenge rejected.',
        })
    }

    return { success: true, ...buildRedeemToken(secret, scope, signature) }
})
