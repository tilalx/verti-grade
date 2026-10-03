/// <reference path="../pb_data/types.d.ts" />
const STATUSES = ['open', 'in_progress', 'done', 'dismissed']

function openDefectsQuery(statuses) {
    const list = statuses.map((status) => `'${status}'`).join(', ')
    return `SELECT id, route, category, created FROM tasks WHERE kind = 'defect' AND status IN (${list}) AND route != ''`
}

function setStatuses(app, statuses, openStatuses) {
    const tasks = app.findCollectionByNameOrId('tasks_col_id')
    tasks.fields.getByName('status').values = statuses
    app.save(tasks)

    const openDefects = app.findCollectionByNameOrId(
        'open_route_defects_col_id',
    )
    openDefects.viewQuery = openDefectsQuery(openStatuses)
    app.save(openDefects)
}

migrate(
    (app) =>
        setStatuses(
            app,
            [...STATUSES, 'waiting'],
            ['open', 'in_progress', 'waiting'],
        ),
    (app) => {
        app.db()
            .newQuery(
                "UPDATE tasks SET status = 'open' WHERE status = 'waiting'",
            )
            .execute()
        setStatuses(app, STATUSES, ['open', 'in_progress'])
    },
)
