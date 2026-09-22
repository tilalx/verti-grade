/// <reference path="../pb_data/types.d.ts" />

const MANAGE_USERS = '@request.auth.role.permissions.name ?= "manage_users"'
const DELETE_RULE = `${MANAGE_USERS} && name != "admin"`

const SEED_COLORS = {
    admin: '#7C4DFF',
    routesetter: '#26A69A',
    user: '#78909C',
}

migrate(
    (app) => {
        const roles = app.findCollectionByNameOrId('roles_collection_id')

        roles.fields.addAt(
            roles.fields.length,
            new Field({
                autogeneratePattern: '',
                hidden: false,
                id: 'text_role_color',
                max: 7,
                min: 0,
                name: 'color',
                pattern: '^#[0-9a-fA-F]{6}$',
                presentable: false,
                primaryKey: false,
                required: false,
                system: false,
                type: 'text',
            }),
        )

        roles.createRule = MANAGE_USERS
        roles.deleteRule = DELETE_RULE

        app.save(roles)

        for (const role of app.findAllRecords(roles)) {
            const color = SEED_COLORS[role.get('name')]
            if (!color) continue
            role.set('color', color)
            app.save(role)
        }
    },
    (app) => {
        const roles = app.findCollectionByNameOrId('roles_collection_id')

        roles.fields.removeById('text_role_color')
        roles.createRule = null
        roles.deleteRule = null

        app.save(roles)
    },
)
