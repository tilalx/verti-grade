/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        // Add role relation field
        collection.fields.addAt(
            collection.fields.length,
            new Field({
                cascadeDelete: false,
                collectionId: 'roles_collection_id',
                hidden: false,
                id: 'relation_user_role',
                maxSelect: 1,
                minSelect: 0,
                name: 'role',
                presentable: false,
                required: false,
                system: false,
                type: 'relation',
            }),
        )

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        collection.fields.removeById('relation_user_role')

        return app.save(collection)
    },
)
