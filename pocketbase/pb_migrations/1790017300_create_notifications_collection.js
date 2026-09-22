/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // A generic in-app queue, fanned out one row per recipient by
        // pb_hooks/utils/notifications.js.
        //
        // `type` is free text rather than a select on purpose: adding a new
        // kind of notification should cost an i18n key, not a migration. The
        // wording lives in the client (notifications.center.types.<type>) and
        // the interpolation values in `params`, so the queue stays localised
        // across all five locales without the hooks knowing about i18n.
        //
        // `user` cascades: deleting a user is meant to erase that user, so
        // their queue goes with them -- same reasoning as audit_logs.actor.
        const collection = new Collection({
            // Only hooks write here. An API-createable notification is a
            // forgeable one, so there is no create rule at all.
            createRule: null,
            deleteRule: 'user = @request.auth.id',
            fields: [
                {
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    id: 'text3208210256',
                    max: 15,
                    min: 15,
                    name: 'id',
                    pattern: '^[a-z0-9]+$',
                    presentable: false,
                    primaryKey: true,
                    required: true,
                    system: true,
                    type: 'text',
                },
                {
                    cascadeDelete: true,
                    collectionId: '_pb_users_auth_',
                    hidden: false,
                    id: 'relation_notif_user',
                    maxSelect: 1,
                    minSelect: 0,
                    name: 'user',
                    presentable: false,
                    required: true,
                    system: false,
                    type: 'relation',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_notif_type',
                    max: 100,
                    min: 1,
                    name: 'type',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: true,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'json_notif_params',
                    maxSize: 4000,
                    name: 'params',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'json',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_notif_url',
                    max: 500,
                    min: 0,
                    name: 'url',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'bool_notif_read',
                    name: 'read',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'bool',
                },
                {
                    hidden: false,
                    id: 'autodate_notif_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
            ],
            id: 'notifications_col_id',
            indexes: [
                'CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user`, `read`)',
                'CREATE INDEX `idx_notifications_user_created` ON `notifications` (`user`, `created`)',
            ],
            // The `@request.auth.id != ""` guard is load-bearing: without it an
            // unauthenticated caller matches `user = ""` and reads rows whose
            // relation is empty.
            listRule: '@request.auth.id != "" && user = @request.auth.id',
            name: 'notifications',
            system: false,
            type: 'base',
            // Owner-only, so the only thing worth changing here is `read`.
            updateRule: '@request.auth.id != "" && user = @request.auth.id',
            viewRule: '@request.auth.id != "" && user = @request.auth.id',
        })

        app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('notifications_col_id')
        app.delete(collection)
    },
)
