/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // ── Routes collection ──────────────────────────────────────────────
        const routes = app.findCollectionByNameOrId('routes')
        routes.listRule = ''
        routes.viewRule = ''
        routes.createRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        routes.updateRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        routes.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        app.save(routes)

        // ── Ratings collection ─────────────────────────────────────────────
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.listRule = ''
        ratings.viewRule = ''
        ratings.createRule = ''
        ratings.updateRule =
            '@request.auth.role.permissions.name ?= "manage_comments"'
        ratings.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_comments"'
        app.save(ratings)

        // ── Settings collection ────────────────────────────────────────────
        const settings = app.findCollectionByNameOrId('settings')
        settings.listRule = ''
        settings.viewRule = ''
        settings.createRule =
            '@request.auth.role.permissions.name ?= "manage_settings"'
        settings.updateRule =
            '@request.auth.role.permissions.name ?= "manage_settings"'
        settings.deleteRule = null
        app.save(settings)

        // ── Roles collection ─────────────────────────────────────────────
        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')
        rolesCol.updateRule =
            '@request.auth.role.permissions.name ?= "manage_users"'
        app.save(rolesCol)

        // ── Users collection ───────────────────────────────────────────────
        const users = app.findCollectionByNameOrId('users')
        users.listRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        users.viewRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        users.createRule =
            '@request.auth.role.permissions.name ?= "manage_users"'
        users.updateRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        users.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_users" && id != @request.auth.id'
        app.save(users)
    },
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        routes.listRule = ''
        routes.viewRule = ''
        routes.createRule = '@request.auth.id != ""'
        routes.updateRule = '@request.auth.id != ""'
        routes.deleteRule = '@request.auth.id != ""'
        app.save(routes)

        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.listRule = ''
        ratings.viewRule = ''
        ratings.createRule = ''
        ratings.updateRule = '@request.auth.id != ""'
        ratings.deleteRule = '@request.auth.id != ""'
        app.save(ratings)

        const settings = app.findCollectionByNameOrId('settings')
        settings.listRule = ''
        settings.viewRule = ''
        settings.createRule = '@request.auth.id != ""'
        settings.updateRule = '@request.auth.id != ""'
        settings.deleteRule = '@request.auth.id != ""'
        app.save(settings)

        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')
        rolesCol.updateRule = '@request.auth.role.name = "admin"'
        app.save(rolesCol)

        const users = app.findCollectionByNameOrId('users')
        users.listRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        users.viewRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        users.createRule = null
        users.updateRule =
            'id = @request.auth.id || @request.auth.role.name = "admin"'
        users.deleteRule =
            '@request.auth.role.name = "admin" && id != @request.auth.id'
        app.save(users)
    },
)
