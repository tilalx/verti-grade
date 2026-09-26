/// <reference path="../pb_data/types.d.ts" />
const OWNER = '@request.auth.id != "" && user = @request.auth.id'
const TICK_RATE_LIMIT = {
    label: 'ticks:create',
    audience: '@auth',
    duration: 600,
    maxRequests: 120,
}

migrate(
    (app) => {
        const tickSends = new Collection({
            id: 'tick_sends_col_id',
            name: 'tick_sends',
            type: 'view',
            listRule: OWNER,
            viewRule: OWNER,
            viewQuery:
                "SELECT MIN(id) AS id, user, route FROM ticks WHERE type != 'attempt' AND route != '' GROUP BY user, route",
        })
        app.save(tickSends)

        const settings = app.settings()
        settings.rateLimits.rules = [
            ...settings.rateLimits.rules.filter(
                (rule) => rule.label !== TICK_RATE_LIMIT.label,
            ),
            TICK_RATE_LIMIT,
        ]
        app.save(settings)
    },
    (app) => {
        app.delete(app.findCollectionByNameOrId('tick_sends_col_id'))

        const settings = app.settings()
        settings.rateLimits.rules = settings.rateLimits.rules.filter(
            (rule) => rule.label !== TICK_RATE_LIMIT.label,
        )
        app.save(settings)
    },
)
