/// <reference path="../pb_data/types.d.ts" />

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
