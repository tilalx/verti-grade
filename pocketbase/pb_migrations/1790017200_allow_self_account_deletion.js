/// <reference path="../pb_data/types.d.ts" />

// 1774100001 blocked self-deletion outright (`id != @request.auth.id`) so an
// admin could not delete themselves off the user list by accident. That guard
// also blocked the account owner deleting their own account, which they are
// entitled to do. Rules cannot tell the two UIs apart, so the self-delete arm
// is allowed here and the admin list keeps hiding its own delete button.
const WITH_SELF =
    'id = @request.auth.id || (@request.auth.role.permissions.name ?= "manage_users" && id != @request.auth.id)'
const WITHOUT_SELF =
    '@request.auth.role.permissions.name ?= "manage_users" && id != @request.auth.id'

migrate(
    (app) => {
        const users = app.findCollectionByNameOrId('users')
        users.deleteRule = WITH_SELF
        app.save(users)
    },
    (app) => {
        const users = app.findCollectionByNameOrId('users')
        users.deleteRule = WITHOUT_SELF
        app.save(users)
    },
)
