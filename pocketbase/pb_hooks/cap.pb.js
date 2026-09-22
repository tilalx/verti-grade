/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'rating')
    e.next()
}, 'ratings')

onRecordCreateRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'report')
    e.next()
}, 'reports')

onRecordAuthWithPasswordRequest((e) => {
    require(`${__hooks}/utils/cap.js`).enforce(e, 'login')
    e.next()
}, 'users')

onRecordRequestPasswordResetRequest((e) => {
    if (!e.auth) require(`${__hooks}/utils/cap.js`).enforce(e, 'password-reset')
    e.next()
}, 'users')

// ── Spent tokens ─────────────────────────────────────────────────────────────
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
