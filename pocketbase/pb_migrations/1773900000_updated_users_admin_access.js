/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        collection.listRule =
            'id = @request.auth.id || @request.auth.role = "admin"'
        collection.viewRule =
            'id = @request.auth.id || @request.auth.role = "admin"'
        collection.deleteRule =
            '@request.auth.role = "admin" && id != @request.auth.id'

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        collection.listRule = 'id = @request.auth.id'
        collection.viewRule = 'id = @request.auth.id'
        collection.deleteRule = null

        return app.save(collection)
    },
)
