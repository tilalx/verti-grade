/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // ── Routes collection ──────────────────────────────────────────────
        const routes = app.findCollectionByNameOrId('routes')
        // Public can list/view routes (for the homepage)
        routes.listRule = ''
        routes.viewRule = ''
        // Only users with manage_routes permission can create/update/delete
        routes.createRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        routes.updateRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        routes.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_routes"'
        app.save(routes)

        // ── Ratings collection ─────────────────────────────────────────────
        const ratings = app.findCollectionByNameOrId('ratings')
        // Everyone can list/view/create ratings (including unauthenticated)
        ratings.listRule = ''
        ratings.viewRule = ''
        ratings.createRule = ''
        // Only users with manage_comments permission can update/delete ratings
        ratings.updateRule =
            '@request.auth.role.permissions.name ?= "manage_comments"'
        ratings.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_comments"'
        app.save(ratings)

        // ── Settings collection ────────────────────────────────────────────
        const settings = app.findCollectionByNameOrId('settings')
        // Any authenticated user can read settings (needed for theme/logo)
        settings.listRule = ''
        settings.viewRule = ''
        // Only users with manage_settings permission can modify
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
        // List/view: own record or manage_users permission
        users.listRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        users.viewRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        // Create: manage_users permission (allows admins to create users, not just superadmins)
        users.createRule =
            '@request.auth.role.permissions.name ?= "manage_users"'
        // Update: own record or manage_users permission
        users.updateRule =
            'id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users"'
        // Delete: manage_users permission, cannot delete self
        users.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_users" && id != @request.auth.id'
        app.save(users)
    },
    (app) => {
        // Revert to previous rules
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
