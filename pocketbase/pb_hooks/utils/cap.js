/// <reference path="../../pb_data/types.d.ts" />

const CAP_HEADER = 'x_cap_token'

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

function enforce(e, scope) {
    const key = secret()
    if (!key) return

    const token = headerToken(e)
    if (!token) {
        throw new BadRequestError('Captcha verification required.')
    }

    let payload
    try {
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

    try {
        const record = new Record(e.app.findCollectionByNameOrId('cap_nonces'))
        record.set('jti', jti)
        e.app.save(record)
    } catch (err) {
        throw new BadRequestError('Captcha token already used.')
    }
}

module.exports = { secret, enforce }
