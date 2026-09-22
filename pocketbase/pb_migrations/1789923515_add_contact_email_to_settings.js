/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')

        collection.fields.addAt(
            collection.fields.length,
            new Field({
                exceptDomains: null,
                hidden: false,
                id: 'email_settings_contact',
                name: 'contact_email',
                onlyDomains: null,
                presentable: false,
                required: false,
                system: false,
                type: 'email',
            }),
        )

        app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        collection.fields.removeById('email_settings_contact')
        app.save(collection)
    },
)
