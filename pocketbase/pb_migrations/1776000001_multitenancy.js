/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // ── 1. tenants collection ──────────────────────────────────────────
        const tenantsCollection = new Collection({
            id: 'tenants_col_id001',
            name: 'tenants',
            type: 'base',
            system: false,
            listRule: '',
            viewRule: '',
            createRule: null,
            updateRule: null,
            deleteRule: null,
            fields: [
                {
                    id: 'text3208210256',
                    name: 'id',
                    type: 'text',
                    primaryKey: true,
                    system: true,
                    required: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    min: 15,
                    max: 15,
                    pattern: '^[a-z0-9]+$',
                    hidden: false,
                    presentable: false,
                },
                {
                    id: 'tenants_name',
                    name: 'name',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 100,
                    hidden: false,
                    presentable: true,
                    primaryKey: false,
                    system: false,
                },
                {
                    id: 'tenants_slug',
                    name: 'slug',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 50,
                    pattern: '^[a-z0-9-]+$',
                    hidden: false,
                    presentable: false,
                    primaryKey: false,
                    system: false,
                },
                {
                    id: 'tenants_domains',
                    name: 'domains',
                    type: 'json',
                    required: false,
                    maxSize: 5000,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tenants_active',
                    name: 'active',
                    type: 'bool',
                    required: false,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tenants_created',
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tenants_updated',
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
            ],
            indexes: ['CREATE UNIQUE INDEX `idx_tenants_slug` ON `tenants` (`slug`)'],
        })
        app.save(tenantsCollection)

        // ── 2. tenant_users collection ────────────────────────────────────
        const tenantUsersCollection = new Collection({
            id: 'tenant_users_col',
            name: 'tenant_users',
            type: 'base',
            system: false,
            listRule: '@request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users")',
            viewRule: '@request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role.permissions.name ?= "manage_users")',
            createRule: '@request.auth.id != "" && @request.auth.is_super_admin = true',
            updateRule: '@request.auth.id != "" && @request.auth.is_super_admin = true',
            deleteRule: '@request.auth.id != "" && @request.auth.is_super_admin = true',
            fields: [
                {
                    id: 'text3208210256',
                    name: 'id',
                    type: 'text',
                    primaryKey: true,
                    system: true,
                    required: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    min: 15,
                    max: 15,
                    pattern: '^[a-z0-9]+$',
                    hidden: false,
                    presentable: false,
                },
                {
                    id: 'tu_tenant_id',
                    name: 'tenant_id',
                    type: 'relation',
                    collectionId: 'tenants_col_id001',
                    maxSelect: 1,
                    minSelect: 0,
                    required: true,
                    cascadeDelete: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tu_user_id',
                    name: 'user_id',
                    type: 'relation',
                    collectionId: '_pb_users_auth_',
                    maxSelect: 1,
                    minSelect: 0,
                    required: true,
                    cascadeDelete: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tu_created',
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'tu_updated',
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_tenant_users_unique` ON `tenant_users` (`tenant_id`, `user_id`)',
            ],
        })
        app.save(tenantUsersCollection)

        // ── 3. locations collection ───────────────────────────────────────
        const locationsCollection = new Collection({
            id: 'locations_col_id',
            name: 'locations',
            type: 'base',
            system: false,
            listRule: '',
            viewRule: '',
            createRule: '@request.auth.role.permissions.name ?= "manage_settings" && @request.body.tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id',
            updateRule: '@request.auth.role.permissions.name ?= "manage_settings" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id',
            deleteRule: '@request.auth.role.permissions.name ?= "manage_settings" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id',
            fields: [
                {
                    id: 'text3208210256',
                    name: 'id',
                    type: 'text',
                    primaryKey: true,
                    system: true,
                    required: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    min: 15,
                    max: 15,
                    pattern: '^[a-z0-9]+$',
                    hidden: false,
                    presentable: false,
                },
                {
                    id: 'loc_tenant_id',
                    name: 'tenant_id',
                    type: 'relation',
                    collectionId: 'tenants_col_id001',
                    maxSelect: 1,
                    minSelect: 0,
                    required: true,
                    cascadeDelete: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'loc_name',
                    name: 'name',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 100,
                    hidden: false,
                    presentable: true,
                    primaryKey: false,
                    system: false,
                },
                {
                    id: 'loc_order',
                    name: 'order',
                    type: 'number',
                    required: false,
                    min: 0,
                    onlyInt: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'loc_created',
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
                {
                    id: 'loc_updated',
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                    hidden: false,
                    presentable: false,
                    system: false,
                },
            ],
            indexes: [],
        })
        app.save(locationsCollection)

        // ── 4. Add tenant_id to routes + change location select → text ───
        // Backup location values before PB drops the column on field removal
        try {
            app.db()
                .newQuery(
                    'ALTER TABLE routes ADD COLUMN __loc_bk TEXT',
                )
                .execute()
            app.db()
                .newQuery('UPDATE routes SET __loc_bk = location')
                .execute()
        } catch (_) {}

        const routes = app.findCollectionByNameOrId('routes')
        // Remove old select field (id: sypedztv) — PB will DROP the column
        routes.fields.removeById('sypedztv')
        // Add new text field with a DIFFERENT id (same id → "type cannot change")
        routes.fields.addAt(
            routes.fields.length,
            new Field({
                autogeneratePattern: '',
                hidden: false,
                id: 'routes_loc_text01',
                max: 100,
                min: 0,
                name: 'location',
                pattern: '',
                presentable: false,
                primaryKey: false,
                required: false,
                system: false,
                type: 'text',
            }),
        )
        routes.fields.addAt(
            routes.fields.length,
            new Field({
                cascadeDelete: false,
                collectionId: 'tenants_col_id001',
                hidden: false,
                id: 'routes_tenant_id',
                maxSelect: 1,
                minSelect: 0,
                name: 'tenant_id',
                presentable: false,
                required: false,
                system: false,
                type: 'relation',
            }),
        )
        routes.createRule =
            '@request.auth.role.permissions.name ?= "manage_routes" && @request.body.tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        routes.updateRule =
            '@request.auth.role.permissions.name ?= "manage_routes" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        routes.deleteRule =
            '@request.auth.role.permissions.name ?= "manage_routes" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        app.save(routes)

        // Restore location values into the new text column, then drop backup
        try {
            app.db()
                .newQuery(
                    'UPDATE routes SET location = __loc_bk WHERE __loc_bk IS NOT NULL',
                )
                .execute()
            app.db()
                .newQuery('ALTER TABLE routes DROP COLUMN __loc_bk')
                .execute()
        } catch (_) {}

        // ── 5. Add tenant_id to ratings ───────────────────────────────────
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.fields.addAt(
            ratings.fields.length,
            new Field({
                cascadeDelete: false,
                collectionId: 'tenants_col_id001',
                hidden: false,
                id: 'ratings_tenant_id',
                maxSelect: 1,
                minSelect: 0,
                name: 'tenant_id',
                presentable: false,
                required: false,
                system: false,
                type: 'relation',
            }),
        )
        app.save(ratings)

        // ── 6. Add tenant_id to settings ──────────────────────────────────
        const settings = app.findCollectionByNameOrId('settings')
        settings.fields.addAt(
            settings.fields.length,
            new Field({
                cascadeDelete: false,
                collectionId: 'tenants_col_id001',
                hidden: false,
                id: 'settings_tenant_id',
                maxSelect: 1,
                minSelect: 0,
                name: 'tenant_id',
                presentable: false,
                required: false,
                system: false,
                type: 'relation',
            }),
        )
        settings.updateRule =
            '@request.auth.role.permissions.name ?= "manage_settings" && tenant_id.tenant_users_via_tenant_id.user_id ?= @request.auth.id'
        app.save(settings)

        // ── 7. Add is_super_admin to users ────────────────────────────────
        const users = app.findCollectionByNameOrId('_pb_users_auth_')
        users.fields.addAt(
            users.fields.length,
            new Field({
                hidden: false,
                id: 'users_is_super_admin',
                name: 'is_super_admin',
                presentable: false,
                required: false,
                system: false,
                type: 'bool',
            }),
        )
        app.save(users)

        // ── 8. Update averageRating view to include tenant_id ─────────────
        const avgRating = app.findCollectionByNameOrId('vcfw600rzblhed3')
        avgRating.viewQuery = `SELECT
    routes.id,
    routes.name,
    routes.tenant_id,
    AVG(ratings.rating) AS average_rating
FROM
    routes
LEFT JOIN
    ratings ON routes.id = ratings.route_id
GROUP BY
    routes.id`
        app.save(avgRating)

        // ── 9. Update usedColors view to include tenant_id ────────────────
        const usedColors = app.findCollectionByNameOrId('pbc_1744051461')
        usedColors.viewQuery = `SELECT id, color, tenant_id
FROM (
    SELECT id, color, tenant_id,
           ROW_NUMBER() OVER (PARTITION BY color, tenant_id ORDER BY id) AS rn
    FROM routes
)
WHERE rn = 1`
        app.save(usedColors)

        // ── 10. Seed: Default tenant ──────────────────────────────────────
        const tenantsCol = app.findCollectionByNameOrId('tenants_col_id001')
        const defaultTenant = new Record(tenantsCol)
        defaultTenant.set('name', 'Default')
        defaultTenant.set('slug', 'default')
        defaultTenant.set('domains', [])
        defaultTenant.set('active', true)
        app.save(defaultTenant)
        const defaultTenantId = defaultTenant.id

        // ── 11. Migrate existing routes to Default tenant ─────────────────
        const existingRoutes = app.findRecordsByFilter('routes', '1=1', '', 0, 0)
        for (const route of existingRoutes) {
            route.set('tenant_id', defaultTenantId)
            app.saveNoValidate(route)
        }

        // ── 12. Migrate existing ratings to Default tenant ────────────────
        const existingRatings = app.findRecordsByFilter('ratings', '1=1', '', 0, 0)
        for (const rating of existingRatings) {
            rating.set('tenant_id', defaultTenantId)
            app.saveNoValidate(rating)
        }

        // ── 13. Migrate existing settings record to Default tenant ───────────
        // Find any existing settings record that has no tenant yet (pre-multitenancy)
        try {
            const existingSettings = app.findRecordsByFilter('settings', 'tenant_id = ""', '', 1, 0)
            if (existingSettings.length > 0) {
                existingSettings[0].set('tenant_id', defaultTenantId)
                app.saveNoValidate(existingSettings[0])
            } else {
                // No existing settings — create one for the default tenant
                const settingsCol = app.findCollectionByNameOrId('settings')
                const newSettings = new Record(settingsCol)
                newSettings.set('tenant_id', defaultTenantId)
                app.saveNoValidate(newSettings)
            }
        } catch (_) {
            // settings collection may not exist, skip
        }

        // ── 14. Create tenant_users for all existing users ────────────────
        const tuCol = app.findCollectionByNameOrId('tenant_users_col')
        const existingUsers = app.findRecordsByFilter('users', '1=1', '', 0, 0)
        for (const user of existingUsers) {
            const tu = new Record(tuCol)
            tu.set('tenant_id', defaultTenantId)
            tu.set('user_id', user.id)
            app.saveNoValidate(tu)
        }

        // ── 15. Seed locations for Default tenant ─────────────────────────
        const locationsCol = app.findCollectionByNameOrId('locations_col_id')

        const hanau = new Record(locationsCol)
        hanau.set('tenant_id', defaultTenantId)
        hanau.set('name', 'Hanau')
        hanau.set('order', 1)
        app.saveNoValidate(hanau)

        const gelnhausen = new Record(locationsCol)
        gelnhausen.set('tenant_id', defaultTenantId)
        gelnhausen.set('name', 'Gelnhausen')
        gelnhausen.set('order', 2)
        app.saveNoValidate(gelnhausen)
    },
    (app) => {
        // ── Rollback ──────────────────────────────────────────────────────
        try {
            const avgRating = app.findCollectionByNameOrId('vcfw600rzblhed3')
            avgRating.viewQuery = `SELECT
    routes.id,
    routes.name,
    AVG(ratings.rating) AS average_rating
FROM
    routes
LEFT JOIN
    ratings ON routes.id = ratings.route_id
GROUP BY
    routes.id`
            app.save(avgRating)
        } catch (_) {}

        try {
            const usedColors = app.findCollectionByNameOrId('pbc_1744051461')
            usedColors.viewQuery = `SELECT id, color
FROM (
    SELECT id, color,
           ROW_NUMBER() OVER (PARTITION BY color ORDER BY id) AS rn
    FROM routes
)
WHERE rn = 1`
            app.save(usedColors)
        } catch (_) {}

        try {
            // Backup location text values before removing the text field
            try {
                app.db()
                    .newQuery(
                        'ALTER TABLE routes ADD COLUMN __loc_bk TEXT',
                    )
                    .execute()
                app.db()
                    .newQuery('UPDATE routes SET __loc_bk = location')
                    .execute()
            } catch (_) {}

            const routes = app.findCollectionByNameOrId('routes')
            routes.fields.removeById('routes_tenant_id')
            routes.fields.removeById('routes_loc_text01')
            routes.fields.addAt(
                routes.fields.length,
                new Field({
                    hidden: false,
                    id: 'sypedztv',
                    maxSelect: 1,
                    name: 'location',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'select',
                    values: ['Hanau', 'Gelnhausen'],
                }),
            )
            routes.createRule = '@request.auth.role.permissions.name ?= "manage_routes"'
            routes.updateRule = '@request.auth.role.permissions.name ?= "manage_routes"'
            routes.deleteRule = '@request.auth.role.permissions.name ?= "manage_routes"'
            app.save(routes)

            // Restore location values where they match valid select options
            try {
                app.db()
                    .newQuery(
                        "UPDATE routes SET location = __loc_bk WHERE __loc_bk IN ('Hanau', 'Gelnhausen')",
                    )
                    .execute()
                app.db()
                    .newQuery('ALTER TABLE routes DROP COLUMN __loc_bk')
                    .execute()
            } catch (_) {}
        } catch (_) {}

        try {
            const ratings = app.findCollectionByNameOrId('ratings')
            ratings.fields.removeById('ratings_tenant_id')
            app.save(ratings)
        } catch (_) {}

        try {
            const settings = app.findCollectionByNameOrId('settings')
            settings.fields.removeById('settings_tenant_id')
            settings.updateRule = '@request.auth.role.permissions.name ?= "manage_settings"'
            app.save(settings)
        } catch (_) {}

        try {
            const users = app.findCollectionByNameOrId('_pb_users_auth_')
            users.fields.removeById('users_is_super_admin')
            app.save(users)
        } catch (_) {}

        try {
            const locationsCol = app.findCollectionByNameOrId('locations_col_id')
            app.delete(locationsCol)
        } catch (_) {}

        try {
            const tuCol = app.findCollectionByNameOrId('tenant_users_col')
            app.delete(tuCol)
        } catch (_) {}

        try {
            const tenantsCol = app.findCollectionByNameOrId('tenants_col_id001')
            app.delete(tenantsCol)
        } catch (_) {}
    },
)
