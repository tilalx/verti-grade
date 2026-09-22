/// <reference path="../pb_data/types.d.ts" />

// Roles were fixed at the three seeded records: createRule and deleteRule were
// both null, so adding or removing one meant opening the superuser panel. The
// app now owns the whole role lifecycle, which needs both rules opened to the
// same permission that already governs role edits.
//
// This grants no new privilege. `manage_users` already carries roles.updateRule
// (1774100001), so such a user can already hand themselves any permission by
// editing an existing role -- being able to create a second role is not a wider
// door than that.
//
// The `name != "admin"` clause is the real guard: the admin role is the
// client-side permission safety net (usePermissions.ts) and the only role that
// cannot lose its permissions, so it must not be deletable by anyone short of a
// superuser. The UI hides its delete button; this is what actually enforces it.
const MANAGE_USERS = '@request.auth.role.permissions.name ?= "manage_users"'
const DELETE_RULE = `${MANAGE_USERS} && name != "admin"`

// Seeded so the chips are not colorless the moment this lands.
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
