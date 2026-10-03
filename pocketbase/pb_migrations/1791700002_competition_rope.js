/// <reference path="../pb_data/types.d.ts" />
const MANAGE = '@request.auth.role.permissions.name ?= "manage_competitions"'
const JUDGE = '@request.auth.role.permissions.name ?= "judge_competitions"'
const OWN_SCORE = '(@request.auth.id != "" && entry.user = @request.auth.id)'
const BOULDER_FORMATS = ['dynamic', 'fixed', 'ifsc']
const ALL_FORMATS = [...BOULDER_FORMATS, 'tops', 'route_points', 'lead_height']

function addFields(collection, fields) {
    for (const field of fields) {
        collection.fields.addAt(collection.fields.length, new Field(field))
    }
}

function removeFields(collection, ids) {
    for (const id of ids) collection.fields.removeById(id)
}

function setPermission(app, granted) {
    const permissions = app.findCollectionByNameOrId('permissions_col_id')
    if (granted) {
        const permission = new Record(permissions)
        permission.set('name', 'judge_competitions')
        permission.set('label', 'Judge Competitions')
        app.save(permission)
        for (const roleName of ['admin', 'routesetter']) {
            const role = app.findFirstRecordByData(
                'roles_collection_id',
                'name',
                roleName,
            )
            role.set('permissions', [
                ...(role.get('permissions') || []),
                permission.id,
            ])
            app.save(role)
        }
        return
    }
    const permission = app.findFirstRecordByData(
        permissions,
        'name',
        'judge_competitions',
    )
    for (const role of app.findAllRecords('roles_collection_id')) {
        const permissionIds = role.get('permissions') || []
        if (permissionIds.includes(permission.id)) {
            role.set(
                'permissions',
                permissionIds.filter((id) => id !== permission.id),
            )
            app.save(role)
        }
    }
    app.delete(permission)
}

migrate(
    (app) => {
        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        competitions.fields.getByName('scoring_format').values = ALL_FORMATS
        addFields(competitions, [
            {
                id: 'select_competitions_discipline',
                name: 'discipline',
                type: 'select',
                maxSelect: 1,
                values: ['boulder', 'rope'],
            },
            {
                id: 'url_competitions_registration_url',
                name: 'registration_url',
                type: 'url',
            },
        ])
        app.save(competitions)
        app.db()
            .newQuery(
                "UPDATE competitions SET discipline = 'boulder' WHERE discipline = ''",
            )
            .execute()
        competitions.fields.getByName('discipline').required = true
        app.save(competitions)

        const compRoutes = app.findCollectionByNameOrId(
            'competition_boulders_col_id',
        )
        compRoutes.name = 'competition_routes'
        addFields(compRoutes, [
            {
                id: 'number_routes_hold_count',
                name: 'hold_count',
                type: 'number',
                min: 1,
                max: 200,
                onlyInt: true,
            },
        ])
        compRoutes.indexes = [
            'CREATE UNIQUE INDEX `idx_competition_routes_route` ON `competition_routes` (`competition`, `route`)',
            'CREATE UNIQUE INDEX `idx_competition_routes_number` ON `competition_routes` (`competition`, `number`)',
        ]
        app.save(compRoutes)

        const entries = app.findCollectionByNameOrId(
            'competition_entries_col_id',
        )
        addFields(entries, [
            { id: 'bool_entries_paid', name: 'paid', type: 'bool' },
        ])
        app.save(entries)

        const scores = app.findCollectionByNameOrId('competition_scores_col_id')
        scores.fields.getByName('boulder').name = 'comp_route'
        addFields(scores, [
            {
                id: 'select_scores_style',
                name: 'style',
                type: 'select',
                maxSelect: 1,
                values: ['lead', 'toprope'],
            },
            {
                id: 'number_scores_height',
                name: 'height',
                type: 'number',
                min: 0,
                max: 200,
                onlyInt: true,
            },
            {
                id: 'bool_scores_height_plus',
                name: 'height_plus',
                type: 'bool',
            },
        ])
        scores.createRule = `${MANAGE} || ${JUDGE} || ${OWN_SCORE}`
        scores.updateRule = `${MANAGE} || ${JUDGE} || ${OWN_SCORE}`
        scores.indexes = [
            'CREATE UNIQUE INDEX `idx_competition_scores_entry_route` ON `competition_scores` (`entry`, `comp_route`)',
            'CREATE INDEX `idx_competition_scores_competition` ON `competition_scores` (`competition`)',
        ]
        app.save(scores)

        setPermission(app, true)
    },
    (app) => {
        setPermission(app, false)

        const scores = app.findCollectionByNameOrId('competition_scores_col_id')
        removeFields(scores, [
            'select_scores_style',
            'number_scores_height',
            'bool_scores_height_plus',
        ])
        scores.fields.getByName('comp_route').name = 'boulder'
        scores.createRule = `${MANAGE} || ${OWN_SCORE}`
        scores.updateRule = `${MANAGE} || ${OWN_SCORE}`
        scores.indexes = [
            'CREATE UNIQUE INDEX `idx_competition_scores_entry_boulder` ON `competition_scores` (`entry`, `boulder`)',
            'CREATE INDEX `idx_competition_scores_competition` ON `competition_scores` (`competition`)',
        ]
        app.save(scores)

        const entries = app.findCollectionByNameOrId(
            'competition_entries_col_id',
        )
        removeFields(entries, ['bool_entries_paid'])
        app.save(entries)

        const compRoutes = app.findCollectionByNameOrId(
            'competition_boulders_col_id',
        )
        compRoutes.name = 'competition_boulders'
        removeFields(compRoutes, ['number_routes_hold_count'])
        compRoutes.indexes = [
            'CREATE UNIQUE INDEX `idx_competition_boulders_route` ON `competition_boulders` (`competition`, `route`)',
            'CREATE UNIQUE INDEX `idx_competition_boulders_number` ON `competition_boulders` (`competition`, `number`)',
        ]
        app.save(compRoutes)

        app.db()
            .newQuery(
                "UPDATE competitions SET scoring_format = 'dynamic' WHERE scoring_format NOT IN ('dynamic', 'fixed', 'ifsc')",
            )
            .execute()
        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        removeFields(competitions, [
            'select_competitions_discipline',
            'url_competitions_registration_url',
        ])
        competitions.fields.getByName('scoring_format').values = BOULDER_FORMATS
        app.save(competitions)
    },
)
