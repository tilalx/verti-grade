/// <reference path="../pb_data/types.d.ts" />

// Ensure the singleton settings record always exists so the UI
// never throws a 404 on first boot (before any admin has logged in).
migrate(
    (app) => {
        try {
            app.findRecordById('68oae2zwn6jtsd4', 'settings_123456')
            // Record already exists — nothing to do.
        } catch (_) {
            const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
            const record = new Record(collection)
            record.id = 'settings_123456'
            app.saveNoValidate(record)
        }
    },
    (app) => {
        try {
            const record = app.findRecordById(
                '68oae2zwn6jtsd4',
                'settings_123456',
            )
            app.delete(record)
        } catch (_) {}
    },
)
