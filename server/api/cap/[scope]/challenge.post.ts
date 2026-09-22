import { createError, eventHandler, getRouterParam } from 'h3'
import { generateChallenge } from 'capjs-core'
import { capSecret, isCapScope } from '../../../utils/cap'

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
