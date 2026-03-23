/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Add permissions multi-relation field to roles collection
        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')

        rolesCol.fields.addAt(
            rolesCol.fields.length,
            new Field({
                cascadeDelete: false,
                collectionId: 'permissions_col_id',
                hidden: false,
                id: 'relation_role_perms',
                maxSelect: 50,
                minSelect: 0,
                name: 'permissions',
                presentable: false,
                required: false,
                system: false,
                type: 'relation',
            }),
        )

        // Allow admins to update roles (for permission editing)
        rolesCol.updateRule = '@request.auth.role.name = "admin"'

        app.save(rolesCol)

        // Seed the routesetter role
        const routesetterRole = new Record(rolesCol)
        routesetterRole.set('name', 'routesetter')
        routesetterRole.set(
            'description',
            'Can manage routes, comments, and inventory',
        )
        app.save(routesetterRole)

        // Look up all permission records by name
        const permissionsCol =
            app.findCollectionByNameOrId('permissions_col_id')
        const allPerms = app.findAllRecords(permissionsCol)

        const permIdByName = {}
        for (const perm of allPerms) {
            permIdByName[perm.get('name')] = perm.id
        }

        const allPermIds = Object.values(permIdByName)

        // Define default permission assignments
        const rolePermissions = {
            admin: allPermIds,
            routesetter: [
                'manage_routes',
                'view_analytics',
                'manage_comments',
                'run_inventory',
            ].map((n) => permIdByName[n]),
            user: [],
        }

        // Assign permissions to each role
        const allRoles = app.findAllRecords(rolesCol)
        for (const role of allRoles) {
            const roleName = role.get('name')
            const permIds = rolePermissions[roleName]
            if (permIds) {
                role.set('permissions', permIds)
                app.save(role)
            }
        }
    },
    (app) => {
        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')

        // Remove routesetter role
        try {
            const routesetter = app.findFirstRecordByFilter(
                rolesCol,
                'name = "routesetter"',
            )
            if (routesetter) app.delete(routesetter)
        } catch {}

        // Clear permissions from existing roles
        const allRoles = app.findAllRecords(rolesCol)
        for (const role of allRoles) {
            role.set('permissions', [])
            app.save(role)
        }

        // Remove the permissions field
        rolesCol.fields.removeById('relation_role_perms')
        rolesCol.updateRule = null

        app.save(rolesCol)
    },
)
