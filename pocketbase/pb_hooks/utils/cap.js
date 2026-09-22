/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for the Cap captcha hooks.
//
// Same constraint as utils/audit.js: PocketBase runs each handler in a pooled
// goja runtime that cannot see enclosing file scope, so every handler has to
// require() this module from inside its own body.

const CAP_HEADER = 'x_cap_token'

/** Empty when the captcha is switched off, which is the default. */
function secret() {
    return $os.getenv('CAP_SECRET') || ''
}

function headerToken(e) {
    try {
        return String(e.requestInfo().headers[CAP_HEADER] || '')
    } catch (err) {
        return ''
    }
}

/**
 * Rejects the request unless it carries an unspent token for `scope`.
 *
 * Throws rather than degrading: unlike a field guard, there is no safe partial
 * version of "this write was not paid for".
 */
function enforce(e, scope) {
    const key = secret()
    if (!key) return

    const token = headerToken(e)
    if (!token) {
        throw new BadRequestError('Captcha verification required.')
    }

    let payload
    try {
        // Verifies the HS256 signature and the exp claim in one step.
        payload = $security.parseJWT(token, key)
    } catch (err) {
        throw new BadRequestError('Captcha verification failed.')
    }

    if (String(payload.scope || '') !== scope) {
        throw new BadRequestError('Captcha verification failed.')
    }

    const jti = String(payload.jti || '')
    if (!jti) {
        throw new BadRequestError('Captcha verification failed.')
    }

    // The unique index on jti is the actual guard: two requests carrying the
    // same token race here and exactly one of them wins.
    try {
        const record = new Record(e.app.findCollectionByNameOrId('cap_nonces'))
        record.set('jti', jti)
        e.app.save(record)
    } catch (err) {
        throw new BadRequestError('Captcha token already used.')
    }
}

module.exports = { secret, enforce }
