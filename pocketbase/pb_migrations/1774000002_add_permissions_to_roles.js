/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
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

        rolesCol.updateRule = '@request.auth.role.name = "admin"'

        app.save(rolesCol)

        const routesetterRole = new Record(rolesCol)
        routesetterRole.set('name', 'routesetter')
        routesetterRole.set(
            'description',
            'Can manage routes, comments, and inventory',
        )
        app.save(routesetterRole)

        const permissionsCol =
            app.findCollectionByNameOrId('permissions_col_id')
        const allPerms = app.findAllRecords(permissionsCol)

        const permIdByName = {}
        for (const perm of allPerms) {
            permIdByName[perm.get('name')] = perm.id
        }

        const allPermIds = Object.values(permIdByName)

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

        try {
            const routesetter = app.findFirstRecordByFilter(
                rolesCol,
                'name = "routesetter"',
            )
            if (routesetter) app.delete(routesetter)
        } catch {}

        const allRoles = app.findAllRecords(rolesCol)
        for (const role of allRoles) {
            role.set('permissions', [])
            app.save(role)
        }

        rolesCol.fields.removeById('relation_role_perms')
        rolesCol.updateRule = null

        app.save(rolesCol)
    },
)
