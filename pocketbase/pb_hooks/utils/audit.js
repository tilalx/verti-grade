/// <reference path="../../pb_data/types.d.ts" />

const DEFAULT_RETENTION_DAYS = 90

const SKIP_COLLECTIONS = [
    'audit_logs',
    '_mfas',
    '_otps',
    '_externalAuths',
    '_authOrigins',
]

const IGNORED_FIELDS = ['updated', 'tokenKey']

function shouldSkip(collectionName) {
    return SKIP_COLLECTIONS.includes(collectionName)
}

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

function actorId(e) {
    if (e.hasSuperuserAuth && e.hasSuperuserAuth()) return ''
    return e.auth ? e.auth.id : ''
}

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
