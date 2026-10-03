/// <reference path="../pb_data/types.d.ts" />
const FROM_TASK_MANAGERS =
    "FROM users JOIN roles ON roles.id = users.role JOIN json_each(roles.permissions) AS granted JOIN permissions ON permissions.id = granted.value WHERE permissions.name = 'manage_tasks'"

const FULL_NAME =
    "COALESCE(NULLIF(TRIM(COALESCE(users.firstname, '') || ' ' || COALESCE(users.name, '')), ''), users.username)"

function setNameExpression(app, expression) {
    const view = app.findCollectionByNameOrId('task_assignees_col_id')
    view.viewQuery = `SELECT DISTINCT users.id, ${expression} AS name ${FROM_TASK_MANAGERS}`
    app.save(view)
}

migrate(
    (app) => setNameExpression(app, FULL_NAME),
    (app) =>
        setNameExpression(
            app,
            "COALESCE(NULLIF(users.name, ''), users.username)",
        ),
)
