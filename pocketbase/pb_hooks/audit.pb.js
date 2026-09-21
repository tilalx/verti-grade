/// <reference path="../pb_data/types.d.ts" />

// User audit log.
//
// These bind to the *Request hooks rather than the After*Success ones because
// only a RequestEvent carries the actor and the IP -- RecordEvent, which the
// After*Success hooks hand you, has neither. That is also the right semantic
// filter: an internal app.save() from another hook (the reports hook stamping
// notified_at, say) is not a user action and must not appear here.
//
// It also means writing an entry cannot recurse. app.save() is not an API
// request, so it never re-enters these handlers.
//
// Every handler calls e.next() before logging, so only writes that actually
// succeeded are recorded, and every write goes through utils.writeEntry, which
// swallows its own failures: losing an audit entry must never turn a working
// user action into an error response.

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

    // Must be computed before the save: afterwards record.original() is the
    // state we just wrote, and every field looks unchanged.
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
//
// onRecordAuthRequest is deliberately NOT bound: it fires on token refresh as
// well as sign-in, so it would append an entry on every page load. Binding the
// two sign-in methods instead captures real logins only.

onRecordAuthWithPasswordRequest((e) => {
    const utils = require(`${__hooks}/utils/audit.js`)
    const identity = String(e.identity || '')

    try {
        e.next()
    } catch (err) {
        // A rejected sign-in is the entry worth having. e.record is whatever
        // the identity resolved to, which is nothing at all for an unknown
        // account -- then the attempted identity is all we have, and all we
        // need to see an account being probed.
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

// Password reset and email change. The confirm handlers resolve e.record from
// the token, so the actor is known even though the caller is unauthenticated.
//
// Each handler re-requires the module rather than sharing a file-scope helper:
// the pooled goja runtimes cannot see enclosing file scope.

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
//
// GDPR Art. 5(1)(e): entries are kept for the configured window and no longer.
// One DELETE rather than fetch-and-delete, so the cost does not grow with the
// size of the backlog. The prune is not a user action, so it writes no entry
// of its own -- it reports to the PocketBase log.

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
        } catch (err) {
            // Driver did not report a count; the prune still ran.
        }

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
