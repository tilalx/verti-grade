/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const memberOrSuper =
            '@request.auth.id != "" && (@request.auth.is_super_admin = true || tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id)'
        const tenantsMemberOrSuper =
            '@request.auth.id != "" && (@request.auth.is_super_admin = true || tenant_users_via_tenant_id.user_id ?= @request.auth.id)'
        const superOnly =
            '@request.auth.id != "" && @request.auth.is_super_admin = true'

        // ── routes ────────────────────────────────────────────────────────
        const routes = app.findCollectionByNameOrId('routes')
        routes.listRule = memberOrSuper
        routes.viewRule = memberOrSuper
        app.save(routes)

        // ── ratings ───────────────────────────────────────────────────────
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.listRule = memberOrSuper
        ratings.viewRule = memberOrSuper
        app.save(ratings)

        // ── locations ─────────────────────────────────────────────────────
        const locations = app.findCollectionByNameOrId('locations_col_id')
        locations.listRule = memberOrSuper
        locations.viewRule = memberOrSuper
        app.save(locations)

        // ── settings ──────────────────────────────────────────────────────
        const settings = app.findCollectionByNameOrId('settings')
        settings.listRule = memberOrSuper
        settings.viewRule = memberOrSuper
        app.save(settings)

        // ── tenants ───────────────────────────────────────────────────────
        const tenants = app.findCollectionByNameOrId('tenants_col_id001')
        tenants.listRule = tenantsMemberOrSuper
        tenants.viewRule = tenantsMemberOrSuper
        tenants.createRule = superOnly
        tenants.updateRule = superOnly
        tenants.deleteRule = superOnly
        app.save(tenants)

        // ── averageRating view ────────────────────────────────────────────
        // View collections inherit list/view rules separately from the
        // underlying table. The view exposes route id + avg rating, so lock
        // to the same tenant-membership contract as routes.
        try {
            const avg = app.findCollectionByNameOrId('vcfw600rzblhed3')
            avg.listRule = memberOrSuper
            avg.viewRule = memberOrSuper
            app.save(avg)
        } catch (_) {}

        // ── usedColors view ───────────────────────────────────────────────
        try {
            const used = app.findCollectionByNameOrId('pbc_1744051461')
            used.listRule = memberOrSuper
            used.viewRule = memberOrSuper
            app.save(used)
        } catch (_) {}
    },
    (app) => {
        try {
            const routes = app.findCollectionByNameOrId('routes')
            routes.listRule = ''
            routes.viewRule = ''
            app.save(routes)
        } catch (_) {}

        try {
            const ratings = app.findCollectionByNameOrId('ratings')
            ratings.listRule = ''
            ratings.viewRule = ''
            app.save(ratings)
        } catch (_) {}

        try {
            const locations = app.findCollectionByNameOrId('locations_col_id')
            locations.listRule = ''
            locations.viewRule = ''
            app.save(locations)
        } catch (_) {}

        try {
            const settings = app.findCollectionByNameOrId('settings')
            settings.listRule = ''
            settings.viewRule = ''
            app.save(settings)
        } catch (_) {}

        try {
            const tenants = app.findCollectionByNameOrId('tenants_col_id001')
            tenants.listRule = ''
            tenants.viewRule = ''
            tenants.createRule = null
            tenants.updateRule = null
            tenants.deleteRule = null
            app.save(tenants)
        } catch (_) {}

        try {
            const avg = app.findCollectionByNameOrId('vcfw600rzblhed3')
            avg.listRule = ''
            avg.viewRule = ''
            app.save(avg)
        } catch (_) {}

        try {
            const used = app.findCollectionByNameOrId('pbc_1744051461')
            used.listRule = ''
            used.viewRule = ''
            app.save(used)
        } catch (_) {}
    },
)
