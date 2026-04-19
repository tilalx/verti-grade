/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // routes.createRule — remove @request.body.tenant_id check.
        // Go hook (hooks.go) now enforces tenant membership and injects tenant_id;
        // the collection rule only needs to check permission.
        const routes = app.findCollectionByNameOrId('routes')
        routes.createRule = '@request.auth.role.permissions.name ?= "manage_routes"'
        app.save(routes)

        // locations.createRule — same as routes
        const locations = app.findCollectionByNameOrId('locations')
        locations.createRule = '@request.auth.role.permissions.name ?= "manage_settings"'
        app.save(locations)

        // ratings — add ALL rules (currently null = no enforcement at all)
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.createRule = '@request.auth.id != ""'
        ratings.updateRule =
            '@request.auth.role.permissions.name ?= "manage_comments" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        ratings.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_comments" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        app.save(ratings)
    },
    (app) => {
        try {
            const routes = app.findCollectionByNameOrId('routes')
            routes.createRule =
                '@request.auth.role.permissions.name ?= "manage_routes" && @request.body.tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
            app.save(routes)
        } catch (_) {}

        try {
            const locations = app.findCollectionByNameOrId('locations')
            locations.createRule =
                '@request.auth.role.permissions.name ?= "manage_settings" && @request.body.tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
            app.save(locations)
        } catch (_) {}

        try {
            const ratings = app.findCollectionByNameOrId('ratings')
            ratings.createRule = null
            ratings.updateRule = null
            ratings.deleteRule = null
            app.save(ratings)
        } catch (_) {}
    },
)
