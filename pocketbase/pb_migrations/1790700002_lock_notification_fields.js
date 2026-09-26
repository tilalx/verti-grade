/// <reference path="../pb_data/types.d.ts" />
const OWNER_RULE = '@request.auth.id != "" && user = @request.auth.id'
const LOCKED_FIELDS = ['user', 'type', 'params', 'url']

migrate(
    (app) => {
        const notifications = app.findCollectionByNameOrId('notifications')
        notifications.updateRule = [
            OWNER_RULE,
            ...LOCKED_FIELDS.map(
                (name) => `@request.body.${name}:changed = false`,
            ),
        ].join(' && ')
        app.save(notifications)
    },
    (app) => {
        const notifications = app.findCollectionByNameOrId('notifications')
        notifications.updateRule = OWNER_RULE
        app.save(notifications)
    },
)
