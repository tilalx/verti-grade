/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // How long audit_logs entries are kept, in days. Pruned nightly by the
        // auditRetention cron in pb_hooks/audit.pb.js.
        //
        // Public readability is fine, and arguably right: a retention period is
        // a policy statement a privacy notice would publish anyway.
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')

        collection.fields.addAt(
            collection.fields.length,
            new Field({
                hidden: false,
                id: 'number_settings_audit_retention_days',
                max: 3650,
                min: 1,
                name: 'audit_retention_days',
                onlyInt: true,
                presentable: false,
                required: false,
                system: false,
                type: 'number',
            }),
        )

        app.save(collection)

        // PocketBase fields carry no default, so seed the singleton. The hook
        // still falls back to 90 if this is ever blanked.
        try {
            const settings = app.findRecordById('settings', 'settings_123456')
            settings.set('audit_retention_days', 90)
            app.saveNoValidate(settings)
        } catch (err) {
            // Fresh database: the seed migration will create the record later.
        }
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        collection.fields.removeById('number_settings_audit_retention_days')
        app.save(collection)
    },
)
