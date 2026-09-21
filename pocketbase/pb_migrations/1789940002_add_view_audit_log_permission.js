/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const permissionsCol =
            app.findCollectionByNameOrId('permissions_col_id')

        const permission = new Record(permissionsCol)
        permission.set('name', 'view_audit_log')
        permission.set('label', 'View Audit Log')
        app.save(permission)

        // Admin only. Without this permission a user still reads their own
        // entries -- the collection rule grants that to everyone -- so this
        // grants the one thing it cannot: seeing what other people did.
        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')
        const adminRole = app.findFirstRecordByData(rolesCol, 'name', 'admin')
        const permIds = adminRole.get('permissions') || []
        if (!permIds.includes(permission.id)) {
            permIds.push(permission.id)
            adminRole.set('permissions', permIds)
            app.save(adminRole)
        }
    },
    (app) => {
        const permissionsCol =
            app.findCollectionByNameOrId('permissions_col_id')
        const permission = app.findFirstRecordByData(
            permissionsCol,
            'name',
            'view_audit_log',
        )

        const rolesCol = app.findCollectionByNameOrId('roles_collection_id')
        for (const role of app.findAllRecords(rolesCol)) {
            const permIds = role.get('permissions') || []
            if (permIds.includes(permission.id)) {
                role.set(
                    'permissions',
                    permIds.filter((id) => id !== permission.id),
                )
                app.save(role)
            }
        }

        app.delete(permission)
    },
)
