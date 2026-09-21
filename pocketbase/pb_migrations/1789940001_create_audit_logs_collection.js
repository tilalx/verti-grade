/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Append-only record of what users do, fed by the hooks in
        // pb_hooks/audit.pb.js.
        //
        // record_id is plain text, not a relation, for the same reason as
        // reports.content_id: the log has to outlive whatever it describes,
        // and a delete entry is worthless if deleting the record erases it.
        //
        // actor, by contrast, IS a cascading relation. Deleting a user is
        // meant to erase that user, so their entries go with them (GDPR
        // Art. 17). The admin's own "deleted user X" entry survives, so the
        // fact of the deletion stays on record.
        //
        // There is no `updated` autodate and no update rule: entries are
        // never edited, only written and eventually pruned.
        const collection = new Collection({
            createRule: null,
            deleteRule: null,
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
                    id: 'relation_audit_actor',
                    maxSelect: 1,
                    minSelect: 0,
                    name: 'actor',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'relation',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_audit_actor_label',
                    max: 255,
                    min: 0,
                    name: 'actor_label',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'select_audit_action',
                    maxSelect: 1,
                    name: 'action',
                    presentable: false,
                    required: true,
                    system: false,
                    type: 'select',
                    values: [
                        'create',
                        'update',
                        'delete',
                        'login',
                        'login_failed',
                        'password_reset_request',
                        'password_reset',
                        'email_change_request',
                        'email_change',
                    ],
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_audit_collection_name',
                    max: 100,
                    min: 0,
                    name: 'collection_name',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_audit_record_id',
                    max: 50,
                    min: 0,
                    name: 'record_id',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'json_audit_changed_fields',
                    maxSize: 4000,
                    name: 'changed_fields',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'json',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_audit_ip',
                    max: 60,
                    min: 0,
                    name: 'ip',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'autodate_audit_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
            ],
            id: 'audit_logs_col_id',
            indexes: [
                'CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created`)',
                'CREATE INDEX `idx_audit_logs_action` ON `audit_logs` (`action`)',
                'CREATE INDEX `idx_audit_logs_collection_name` ON `audit_logs` (`collection_name`)',
                'CREATE INDEX `idx_audit_logs_actor_created` ON `audit_logs` (`actor`, `created`)',
            ],
            // The `@request.auth.id != ""` guard is load-bearing: without it an
            // unauthenticated caller matches `actor = ""` and reads every
            // anonymous entry.
            listRule:
                '@request.auth.id != "" && (@request.auth.role.permissions.name ?= "view_audit_log" || actor = @request.auth.id)',
            name: 'audit_logs',
            system: false,
            type: 'base',
            updateRule: null,
            viewRule:
                '@request.auth.id != "" && (@request.auth.role.permissions.name ?= "view_audit_log" || actor = @request.auth.id)',
        })

        app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('audit_logs_col_id')
        app.delete(collection)
    },
)
