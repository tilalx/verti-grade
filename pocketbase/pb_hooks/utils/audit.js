/// <reference path="../../pb_data/types.d.ts" />

// Shared helpers for the user audit log hooks.
//
// PocketBase runs every hook handler in a pooled goja runtime that cannot see
// the enclosing file scope, so handlers must require() this module from inside
// the handler body rather than closing over top-level helpers.

const DEFAULT_RETENTION_DAYS = 90

// audit_logs itself must never be logged. Writing an entry goes through
// app.save(), which is not an API request and so cannot re-enter these hooks,
// but a superuser writing through the API could -- this closes that door.
//
// The auth-adjacent system collections are token bookkeeping, not user
// actions: they churn on every login and say nothing the login entry doesn't.
const SKIP_COLLECTIONS = [
    'audit_logs',
    '_mfas',
    '_otps',
    '_externalAuths',
    '_authOrigins',
]

// Bookkeeping PocketBase touches on every write, plus the token key it
// rotates on a password change. `password` is deliberately NOT ignored: the
// field NAME is not a secret, and dropping it would make a password change
// show up as an update that changed nothing.
const IGNORED_FIELDS = ['updated', 'tokenKey']

function shouldSkip(collectionName) {
    return SKIP_COLLECTIONS.includes(collectionName)
}

/**
 * Which fields an update actually changed, by NAME only.
 *
 * Values are deliberately never stored: copying them would clone every
 * comment, email and display name into a second store with its own retention
 * clock, and would make an erasure request far harder to honour. The field
 * names alone answer "what did they touch", which is what a log is for.
 */
function changedFieldNames(record) {
    try {
        const before = record.original().fieldsData()
        const after = record.fieldsData()
        return Object.keys(after).filter((key) => {
            if (IGNORED_FIELDS.includes(key)) return false
            return JSON.stringify(before[key]) !== JSON.stringify(after[key])
        })
    } catch (err) {
        return []
    }
}

/**
 * A human-readable identity for the entry.
 *
 * Entries with no actor relation still need one: an anonymous visitor, a
 * PocketBase superuser acting through the admin UI, or a failed login naming
 * an account that does not exist.
 */
function actorLabel(e) {
    const auth = e.auth
    const email = auth
        ? String(auth.get('email') || auth.get('username') || auth.id || '')
        : ''
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
        return email ? 'superuser:' + email : 'superuser'
    }
    return email
}

/** The acting user, or null for anonymous and superuser requests. */
function actorId(e) {
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) return ''
    return e.auth ? e.auth.id : ''
}

/**
 * Actor fields for an authentication event.
 *
 * The authenticating record is not necessarily a `users` record -- these hooks
 * are unfiltered, so a superuser signing in at /_/ lands here too. The actor
 * relation targets users, and writing a _superusers id into it fails relation
 * validation, which would silently drop the entry for the single most
 * security-relevant sign-in there is. Those get a label instead of a link.
 */
function authActor(e, record, fallbackLabel) {
    const collectionName = record
        ? record.collection().name
        : e.collection
          ? e.collection.name
          : 'users'
    const label = record
        ? String(record.get('email') || record.get('username') || '') ||
          String(fallbackLabel || '')
        : String(fallbackLabel || '')

    if (collectionName !== 'users') {
        return {
            actor: '',
            label: label ? 'superuser:' + label : 'superuser',
            collectionName: collectionName,
            recordId: record ? record.id : '',
        }
    }

    return {
        actor: record ? record.id : '',
        label: label,
        collectionName: collectionName,
        recordId: record ? record.id : '',
    }
}

function clientIp(e) {
    try {
        return String(e.realIP() || '')
    } catch (err) {
        return ''
    }
}

/**
 * Appends one entry. Never throws: an audit failure must not turn a successful
 * user action into an error response.
 */
function writeEntry(app, entry) {
    try {
        const collection = app.findCollectionByNameOrId('audit_logs')
        const record = new Record(collection)
        record.set('actor', entry.actor || '')
        record.set('actor_label', String(entry.actorLabel || '').slice(0, 255))
        record.set('action', entry.action)
        record.set('collection_name', entry.collectionName || '')
        record.set('record_id', entry.recordId || '')
        record.set('changed_fields', entry.changedFields || null)
        record.set('ip', entry.ip || '')
        app.save(record)
    } catch (err) {
        app.logger().error(
            'audit: failed to write entry',
            'action',
            entry && entry.action,
            'collection',
            entry && entry.collectionName,
            'error',
            String(err),
        )
    }
}

/** Appends an authentication entry. Never throws. */
function writeAuthEvent(e, action, fallbackLabel) {
    const who = authActor(e, e.record, fallbackLabel)
    writeEntry(e.app, {
        actor: who.actor,
        actorLabel: who.label,
        action: action,
        collectionName: who.collectionName,
        recordId: who.recordId,
        ip: clientIp(e),
    })
}

/** Retention window in days, falling back to 90 when unset or out of range. */
function retentionDays(app) {
    try {
        const settings = app.findRecordById('settings', 'settings_123456')
        const days = Number(settings.get('audit_retention_days'))
        if (!Number.isFinite(days) || days < 1 || days > 3650) {
            return DEFAULT_RETENTION_DAYS
        }
        return Math.floor(days)
    } catch (err) {
        return DEFAULT_RETENTION_DAYS
    }
}

module.exports = {
    DEFAULT_RETENTION_DAYS,
    SKIP_COLLECTIONS,
    IGNORED_FIELDS,
    shouldSkip,
    changedFieldNames,
    actorLabel,
    actorId,
    authActor,
    clientIp,
    writeEntry,
    writeAuthEvent,
    retentionDays,
}
