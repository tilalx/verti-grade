/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // ratings.createRule previously only checked authentication.
        // Require manage_comments permission and tenant membership.
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.createRule =
            '@request.auth.id != "" && @request.auth.role.permissions.name ?= "manage_routes"'
        app.save(ratings)
    },
    (app) => {
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.createRule = '@request.auth.id != ""'
        app.save(ratings)
    },
)
