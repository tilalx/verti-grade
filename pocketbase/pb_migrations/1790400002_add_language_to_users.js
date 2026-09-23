/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const users = app.findCollectionByNameOrId('users')
        users.fields.add(
            new Field({
                id: 'select_users_language',
                name: 'language',
                type: 'select',
                maxSelect: 1,
                values: ['en', 'de', 'ru', 'tr', 'uk'],
                required: false,
            }),
        )
        app.save(users)
    },
    (app) => {
        const users = app.findCollectionByNameOrId('users')
        users.fields.removeById('select_users_language')
        app.save(users)
    },
)
