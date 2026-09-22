/// <reference path="../../pb_data/types.d.ts" />

/**
 * In-app notification queue.
 *
 * Rows are fanned out one per recipient, so "unread" is a plain boolean on the
 * row and the collection rules are ownership checks. The wording is NOT stored:
 * `type` plus `params` is rendered client-side through i18n, so a notification
 * reads in whatever locale the recipient uses.
 */

/** Every user whose role grants `permission`. */
function usersByPermission(app, permission) {
    try {
        return app.findRecordsByFilter(
            'users',
            `role.permissions.name ?= "${permission}"`,
            '',
            200,
            0,
        )
    } catch (err) {
        app.logger().error(
            'notifications: failed to resolve users by permission',
            'permission',
            permission,
            'error',
            String(err),
        )
        return []
    }
}

/**
 * Queue one notification per user. Never throws: a queue write must not take
 * down the hook it rides along with.
 */
function push(app, { users, type, params, url }) {
    if (!users || !users.length) return 0

    let collection
    try {
        collection = app.findCollectionByNameOrId('notifications')
    } catch (err) {
        app.logger().error(
            'notifications: collection missing',
            'error',
            String(err),
        )
        return 0
    }

    let written = 0
    for (const user of users) {
        try {
            const record = new Record(collection)
            record.set('user', user.id)
            record.set('type', type)
            record.set('params', params || {})
            record.set('url', url || '')
            record.set('read', false)
            app.save(record)
            written++
        } catch (err) {
            app.logger().error(
                'notifications: failed to queue',
                'type',
                type,
                'user',
                user.id,
                'error',
                String(err),
            )
        }
    }

    return written
}

module.exports = { usersByPermission, push }
