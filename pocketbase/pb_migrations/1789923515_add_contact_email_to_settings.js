/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // DSA Art. 11/12 public point of contact, and the second recipient of
        // the new-report alert alongside every manage_reports holder.
        //
        // The settings collection is publicly readable (listRule: ''), which is
        // correct for a published contact address -- and exactly why no SMTP
        // credential may ever be stored here. SMTP is configured in PocketBase.
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
