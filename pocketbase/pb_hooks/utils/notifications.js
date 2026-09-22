/// <reference path="../../pb_data/types.d.ts" />

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
