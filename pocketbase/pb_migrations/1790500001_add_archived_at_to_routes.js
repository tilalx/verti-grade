/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        routes.fields.add(
            new Field({
                id: 'date_routes_archived_at',
                name: 'archived_at',
                type: 'date',
                required: false,
            }),
        )
        app.save(routes)

        app.db()
            .newQuery(
                `UPDATE routes SET archived_at = COALESCE(
                    (SELECT MAX(created) FROM audit_logs
                     WHERE collection_name = 'routes'
                       AND record_id = routes.id
                       AND action = 'update'
                       AND changed_fields LIKE '%"archived"%'),
                    updated
                ) WHERE archived = 1`,
            )
            .execute()
    },
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        routes.fields.removeById('date_routes_archived_at')
        app.save(routes)
    },
)
