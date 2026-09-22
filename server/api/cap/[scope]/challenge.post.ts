import { createError, eventHandler, getRouterParam } from 'h3'
import { generateChallenge } from 'capjs-core'
import { capSecret, isCapScope } from '../../../utils/cap'

/**
 * Issues a proof-of-work challenge. The scope rides in the path because the
 * widget only ever appends `challenge` / `redeem` to its configured endpoint --
 * pointing it at /api/cap/rating/ is what binds the token to rating creation.
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

    return await generateChallenge(secret, { scope })
})
