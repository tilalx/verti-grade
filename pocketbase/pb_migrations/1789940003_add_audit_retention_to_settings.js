/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
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

        try {
            const settings = app.findRecordById('settings', 'settings_123456')
            settings.set('audit_retention_days', 90)
            app.saveNoValidate(settings)
        } catch (err) {}
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        collection.fields.removeById('number_settings_audit_retention_days')
        app.save(collection)
    },
)
