import { createHmac, randomBytes } from 'node:crypto'

/**
 * Cap proof-of-work captcha, server half.
 *
 * Challenge generation and solution checking live here in Nuxt because that is
 * where `capjs-core` can run -- PocketBase is Go with a goja runtime and cannot
 * load an npm package. But the writes being protected (a rating, a report, a
 * sign-in) go straight to PocketBase, which never sees this process.
 *
 * So the redeem token is minted as an HS256 JWT over a secret both halves know,
 * and PocketBase verifies it with $security.parseJWT (pb_hooks/cap.pb.js). No
 * shared store, no server-to-server call, and no PocketBase write credential in
 * Nuxt -- which this app deliberately does not have.
 *
 * Opt-in, following pb_hooks/smtp.pb.js: with CAP_SECRET unset the captcha is
 * simply off, so an existing install keeps working after an upgrade.
 */

/** One scope per protected action, so a token minted for one cannot pay for another. */
export const CAP_SCOPES = [
    'rating',
    'report',
    'password-reset',
    'login',
] as const
export type CapScope = (typeof CAP_SCOPES)[number]

/** How long a solved token stays spendable. Long enough to finish a form. */
const TOKEN_TTL_MS = 5 * 60 * 1000

export function capSecret(): string {
    return process.env.CAP_SECRET || ''
}

export function isCapScope(value: unknown): value is CapScope {
    return CAP_SCOPES.includes(value as CapScope)
}

function base64url(input: string | Buffer): string {
    return Buffer.from(input).toString('base64url')
}

/**
 * Minimal HS256 JWT. Hand-rolled rather than pulled from a library because it
 * is six lines and the only consumer is PocketBase's own JWT parser, which
 * accepts exactly this shape.
 */
export function signCapToken(
    secret: string,
    payload: Record<string, unknown>,
): string {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = base64url(JSON.stringify(payload))
    const signature = createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url')
    return `${header}.${body}.${signature}`
}

/**
 * The token PocketBase will accept once, for one scope.
 *
 * `jti` is the challenge signature that capjs-core hands to `consumeNonce`, not
 * a fresh random: that makes one store do two jobs. PocketBase records spent
 * jtis, which stops both replaying a solved token and re-redeeming the same
 * solved challenge to mint a second one.
 */
export function buildRedeemToken(
    secret: string,
    scope: CapScope,
    challengeSignature: string,
): { token: string; expires: number } {
    const expires = Date.now() + TOKEN_TTL_MS
    const token = signCapToken(secret, {
        scope,
        jti: challengeSignature || randomBytes(16).toString('hex'),
        exp: Math.floor(expires / 1000),
    })
    return { token, expires }
}
