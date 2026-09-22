/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        try {
            app.findRecordById('68oae2zwn6jtsd4', 'settings_123456')
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
