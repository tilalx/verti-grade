/// <reference path="../pb_data/types.d.ts" />

// Cap proof-of-work captcha, enforcement half.
//
// The challenge is issued and the solution checked in Nuxt (server/utils/cap.ts
// and server/api/cap/[scope]/), because capjs-core is an npm package and this
// runtime is goja. What arrives here is the redeem token it minted: an HS256
// JWT over CAP_SECRET, which $security.parseJWT verifies without any call back
// to that process.
//
// Spending is enforced here rather than there on purpose. This is where the
// write happens, and a token that could be replayed would buy an unlimited
// number of them -- so the jti (the challenge signature capjs-core produced)
// goes into cap_nonces, whose unique index makes the token single-use.
//
// Opt-in like pb_hooks/smtp.pb.js: with CAP_SECRET unset nothing is enforced,
// so upgrading an existing install does not lock its visitors out.
//
// Each enforcement point below is an action an anonymous visitor can trigger
// that either shows up publicly or sends mail. Signed-in staff are exempt: they
// are rate limited as a known account, and making a route setter solve a puzzle
// to moderate a comment would be friction for no gain.

onRecordCreateRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'rating')
    e.next()
}, 'ratings')

onRecordCreateRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'report')
    e.next()
}, 'reports')

// Sign-in, users only. The superuser panel at /_/ is PocketBase's own UI and
// cannot attach a token -- gating _superusers here would lock the operator out
// of their own install. That login is covered by the rate limit instead.
onRecordAuthWithPasswordRequest((e) => {
    require(`${__hooks}/utils/cap.js`).enforce(e, 'login')
    e.next()
}, 'users')

// The public forgot-password form. Authenticated callers are the invite path in
// CreateUser.vue -- staff sending mail on purpose, the same split the rate limit
// rules make.
onRecordRequestPasswordResetRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'password-reset')
    e.next()
}, 'users')

// ── Spent tokens ─────────────────────────────────────────────────────────────
//
// A jti is only worth remembering while a token bearing it could still be
// presented. The token lives five minutes; an hour of margin costs nothing and
// keeps the table from growing without bound.
cronAdd('capNoncePrune', '41 * * * *', () => {
    try {
        $app.db()
            .newQuery('DELETE FROM cap_nonces WHERE created < {:cutoff}')
            .bind({
                cutoff: new Date(Date.now() - 3600000)
                    .toISOString()
                    .replace('T', ' '),
            })
            .execute()
    } catch (err) {
        $app.logger().error('cap: nonce prune failed', 'error', String(err))
    }
})

// ── Rate limits, once a captcha is paying part of the bill ───────────────────
//
// 1790200001_enable_rate_limits.js sizes the anonymous write buckets for a hall
// sharing one NATed address, which makes them the limits most likely to reject a
// real climber. A solved challenge costs the client real work, so with the
// captcha on those two can be raised without handing a flooder the difference.
//
// Applied at boot rather than in that migration because it has to follow the
// secret: an install that never sets CAP_SECRET keeps the strict numbers, and
// the loosening can never outlive the protection that justifies it.
onBootstrap((e) => {
    e.next()

    if (!$os.getenv('CAP_SECRET')) return

    const relaxed = { 'ratings:create': 240, 'reports:create': 20 }

    try {
        const settings = $app.settings()
        let changed = false

        for (const rule of settings.rateLimits.rules) {
            const target = relaxed[rule.label]
            if (target && rule.maxRequests !== target) {
                rule.maxRequests = target
                changed = true
            }
        }

        if (changed) {
            $app.save(settings)
            $app.logger().info('cap: raised captcha-gated rate limits')
        }
    } catch (err) {
        $app.logger().error(
            'cap: could not adjust rate limits',
            'error',
            String(err),
        )
    }
})
