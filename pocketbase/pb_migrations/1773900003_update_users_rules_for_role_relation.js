/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        // Update rules to use the role relation (expand role.name)
        collection.listRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        collection.viewRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        collection.updateRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        collection.deleteRule =
            '@request.auth.role.name = "admin" && id != @request.auth.id'

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('_pb_users_auth_')

        // Revert to the string-based rules
        collection.listRule =
            'id = @request.auth.id || @request.auth.role = "admin"'
        collection.viewRule =
            'id = @request.auth.id || @request.auth.role = "admin"'
        collection.updateRule = 'id = @request.auth.id'
        collection.deleteRule =
            '@request.auth.role = "admin" && id != @request.auth.id'

        return app.save(collection)
    },
)
