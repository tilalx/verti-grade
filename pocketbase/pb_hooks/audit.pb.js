/// <reference path="../pb_data/types.d.ts" />

// ── Writes ───────────────────────────────────────────────────────────────────

onRecordCreateRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    const collectionName = e.record.collection().name
    if (utils.shouldSkip(collectionName)) {
        e.next()
        return
    }

    const entry = {
        actor: utils.actorId(e),
        actorLabel: utils.actorLabel(e),
        action: 'create',
        collectionName: collectionName,
        ip: utils.clientIp(e),
    }

    e.next()

    entry.recordId = e.record.id
    utils.writeEntry(e.app, entry)
})

onRecordUpdateRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    const collectionName = e.record.collection().name
    if (utils.shouldSkip(collectionName)) {
        e.next()
        return
    }

    const entry = {
        actor: utils.actorId(e),
        actorLabel: utils.actorLabel(e),
        action: 'update',
        collectionName: collectionName,
        recordId: e.record.id,
        changedFields: utils.changedFieldNames(e.record),
        ip: utils.clientIp(e),
    }

    e.next()

    utils.writeEntry(e.app, entry)
})

onRecordDeleteRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    const collectionName = e.record.collection().name
    if (utils.shouldSkip(collectionName)) {
        e.next()
        return
    }

    const entry = {
        actor: utils.actorId(e),
        actorLabel: utils.actorLabel(e),
        action: 'delete',
        collectionName: collectionName,
        recordId: e.record.id,
        ip: utils.clientIp(e),
    }

    e.next()

    utils.writeEntry(e.app, entry)
})

// ── Authentication ───────────────────────────────────────────────────────────

onRecordAuthWithPasswordRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    const identity = String(e.identity || '')

    try {
        e.next()
    } catch (err) {
        utils.writeAuthEvent(e, 'login_failed', identity)
        throw err
    }

    utils.writeAuthEvent(e, 'login', identity)
})

onRecordAuthWithOAuth2Request((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)

    e.next()

    utils.writeAuthEvent(e, 'login', '')
})

onRecordRequestPasswordResetRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    e.next()
    utils.writeAuthEvent(e, 'password_reset_request', '')
})

onRecordConfirmPasswordResetRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    e.next()
    utils.writeAuthEvent(e, 'password_reset', '')
})

onRecordRequestEmailChangeRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    e.next()
    utils.writeAuthEvent(e, 'email_change_request', '')
})

onRecordConfirmEmailChangeRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    e.next()
    utils.writeAuthEvent(e, 'email_change', '')
})

// ── Retention ────────────────────────────────────────────────────────────────

cronAdd('auditRetention', '17 3 * * *', () => {
    const utils = require(`${__hooks}/utils/audit.js`)

    try {
        const days = utils.retentionDays($app)
        const cutoff = new Date(Date.now() - days * 86400000)
            .toISOString()
            .replace('T', ' ')

        const result = $app
            .db()
            .newQuery('DELETE FROM audit_logs WHERE created < {:cutoff}')
            .bind({ cutoff: cutoff })
            .execute()

        let removed = -1
        try {
            removed = result.rowsAffected()
        } catch (err) {}

        $app.logger().info(
            'audit: pruned expired entries',
            'rows',
            removed,
            'cutoff',
            cutoff,
            'retentionDays',
            days,
        )
    } catch (err) {
        $app.logger().error(
            'audit: retention prune failed',
            'error',
            String(err),
        )
    }
})
