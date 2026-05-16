/// <reference path="../pb_data/types.d.ts" />

// Ratings can be submitted by unauthenticated users.
// Tenant enforcement is handled server-side via the X-Tenant-Id hook.
migrate(
    (app) => {
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.createRule = ''
        app.save(ratings)
    },
    (app) => {
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.createRule =
            '@request.auth.id != "" && @request.auth.role.permissions.name ?= "manage_routes"'
        app.save(ratings)
    },
)
