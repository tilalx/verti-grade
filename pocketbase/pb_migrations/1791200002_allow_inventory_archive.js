/// <reference path="../pb_data/types.d.ts" />
const MANAGE_ROUTES = '@request.auth.role.permissions.name ?= "manage_routes"'
const RUN_INVENTORY = '@request.auth.role.permissions.name ?= "run_inventory"'

migrate(
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        routes.updateRule = `${MANAGE_ROUTES} || (${RUN_INVENTORY} && @request.body.archived:isset = true)`
        app.save(routes)
    },
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        routes.updateRule = MANAGE_ROUTES
        app.save(routes)
    },
)
