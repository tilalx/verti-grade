/// <reference path="../pb_data/types.d.ts" />
const AVERAGE_RATING_VIEW = 'vcfw600rzblhed3'
const SETTINGS = '68oae2zwn6jtsd4'
const ROUTES_INDEX_OLD =
    'CREATE INDEX `idx_7kUMbzeLpY` ON `routes` (\n  `name`,\n  `difficulty`,\n  `difficulty_sign`,\n  `anchor_point`\n)'
const ROUTES_INDEX_NEW =
    'CREATE INDEX `idx_7kUMbzeLpY` ON `routes` (`name`, `grade_index`, `anchor_point`)'

const UIAA = [
    ['1', 1],
    ['2', 1.9],
    ['3', 2.8],
    ['3+', 3.7],
    ['4', 4.6],
    ['4+', 5.5],
    ['5-', 6.4],
    ['5', 7.4],
    ['5+', 8.3],
    ['6-', 9.2],
    ['6', 10.1],
    ['6+', 11],
    ['7-', 12.1],
    ['7', 13.4],
    ['7+', 14.6],
    ['8-', 15.9],
    ['8', 17.1],
    ['8+', 18.4],
    ['9-', 19.6],
    ['9', 20.9],
    ['9+', 22],
    ['10-', 23.4],
    ['10', 24.6],
    ['10+', 26],
]
const FONT = [
    ['<2', 9],
    ['3', 10.9],
    ['4', 12.1],
    ['4+', 13.3],
    ['5', 14.2],
    ['5+', 15],
    ['6A', 15.7],
    ['6A+', 16.4],
    ['6B', 17.1],
    ['6B+', 17.9],
    ['6C', 18.7],
    ['6C+', 19.4],
    ['7A', 20.3],
    ['7A+', 21.3],
    ['7B', 22.4],
    ['7B+', 23.3],
    ['7C', 24.3],
    ['7C+', 25.3],
    ['8A', 26.3],
    ['8A+', 27.3],
    ['8B', 28.4],
    ['8B+', 29.6],
    ['8C', 30.7],
    ['8C+', 31.9],
]
const LEGACY_ALIASES = {
    '1-': '1',
    '1+': '1',
    '2-': '2',
    '2+': '2',
    '3-': '3',
    '4-': '3+',
}

function nearest(table, index) {
    return table.reduce((best, entry) =>
        Math.abs(entry[1] - index) < Math.abs(best[1] - index) ? entry : best,
    )
}

function signSuffix(raw) {
    const value = String(raw ?? '')
        .replace(/"/g, '')
        .trim()
    if (value === 'true' || value === '+' || value === '1') return '+'
    if (value === 'false' || value === '-') return '-'
    return ''
}

function viewQuery(gradeColumns) {
    return (
        'SELECT\n' +
        '    routes.id,\n' +
        '    routes.name,\n' +
        '    routes.color,\n' +
        gradeColumns.map((column) => `    routes.${column},\n`).join('') +
        '    routes.anchor_point,\n' +
        '    routes.location,\n' +
        '    routes.type,\n' +
        '    routes.comment,\n' +
        '    routes.creator,\n' +
        '    routes.archived,\n' +
        '    routes.screw_date,\n' +
        '    routes.created,\n' +
        '    routes.updated,\n' +
        '    CAST(AVG(ratings.rating) AS REAL) AS average_rating,\n' +
        '    COUNT(ratings.id) AS ratings_count\n' +
        'FROM routes\n' +
        'LEFT JOIN ratings ON routes.id = ratings.route_id\n' +
        'GROUP BY routes.id'
    )
}

function gradeFields(collection, gradeRequired) {
    collection.fields.add(
        new Field({
            id: `text_${collection.name}_grade`,
            name: 'grade',
            type: 'text',
            max: 20,
            required: gradeRequired,
        }),
        new Field({
            id: `text_${collection.name}_grade_system`,
            name: 'grade_system',
            type: 'text',
            max: 20,
            required: false,
        }),
        new Field({
            id: `number_${collection.name}_grade_index`,
            name: 'grade_index',
            type: 'number',
            required: false,
        }),
    )
}

function convert(app, table, rowsQuery) {
    const rows = arrayOf(
        new DynamicModel({ id: '', difficulty: 0, sign: '', type: '' }),
    )
    app.db().newQuery(rowsQuery).all(rows)
    for (const row of rows) {
        if (!row.difficulty) continue
        const legacyLabel = `${row.difficulty}${signSuffix(row.sign)}`
        const uiaaLabel = LEGACY_ALIASES[legacyLabel] ?? legacyLabel
        const uiaa = UIAA.find(([label]) => label === uiaaLabel)
        if (!uiaa) continue
        const [grade, index] =
            row.type === 'Boulder' ? nearest(FONT, uiaa[1]) : uiaa
        app.db()
            .newQuery(
                `UPDATE ${table} SET grade = {:grade}, grade_system = {:system}, grade_index = {:index} WHERE id = {:id}`,
            )
            .bind({
                grade,
                system: row.type === 'Boulder' ? 'font' : 'uiaa',
                index,
                id: row.id,
            })
            .execute()
    }
}

function removeFields(collection, names) {
    for (const name of names) {
        const field = collection.fields.getByName(name)
        if (field) collection.fields.removeById(field.id)
    }
}

migrate(
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        const ratings = app.findCollectionByNameOrId('ratings')
        gradeFields(routes, false)
        gradeFields(ratings, false)
        app.save(routes)
        app.save(ratings)

        convert(
            app,
            'routes',
            "SELECT id, COALESCE(difficulty, 0) AS difficulty, COALESCE(CAST(difficulty_sign AS TEXT), '') AS sign, COALESCE(type, '') AS type FROM routes",
        )
        convert(
            app,
            'ratings',
            "SELECT ratings.id, COALESCE(ratings.difficulty, 0) AS difficulty, CASE ratings.difficulty_sign WHEN 1 THEN '+' ELSE '' END AS sign, COALESCE(routes.type, '') AS type FROM ratings LEFT JOIN routes ON routes.id = ratings.route_id",
        )

        const view = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
        view.viewQuery = viewQuery(['grade', 'grade_system', 'grade_index'])
        app.save(view)

        routes.indexes = routes.indexes.map((index) =>
            index === ROUTES_INDEX_OLD ? ROUTES_INDEX_NEW : index,
        )
        removeFields(routes, ['difficulty', 'difficulty_sign'])
        routes.fields.getByName('grade').required = true
        app.save(routes)
        removeFields(ratings, ['difficulty', 'difficulty_sign'])
        app.save(ratings)

        const settings = app.findCollectionByNameOrId(SETTINGS)
        settings.fields.add(
            new Field({
                id: 'text_settings_route_grade_system',
                name: 'route_grade_system',
                type: 'text',
                max: 20,
            }),
            new Field({
                id: 'text_settings_boulder_grade_system',
                name: 'boulder_grade_system',
                type: 'text',
                max: 20,
            }),
        )
        app.save(settings)
        app.db()
            .newQuery(
                "UPDATE settings SET route_grade_system = 'uiaa', boulder_grade_system = 'font'",
            )
            .execute()
    },
    (app) => {
        const settings = app.findCollectionByNameOrId(SETTINGS)
        removeFields(settings, ['route_grade_system', 'boulder_grade_system'])
        app.save(settings)

        const routes = app.findCollectionByNameOrId('routes')
        const ratings = app.findCollectionByNameOrId('ratings')
        routes.fields.add(
            new Field({
                id: 'mahzsklp',
                name: 'difficulty',
                type: 'number',
                required: false,
            }),
            new Field({
                id: '5bpugbxm',
                name: 'difficulty_sign',
                type: 'json',
                maxSize: 2000,
            }),
        )
        ratings.fields.add(
            new Field({
                id: 'number_ratings_difficulty',
                name: 'difficulty',
                type: 'number',
                required: false,
            }),
            new Field({
                id: 'zsqcbufz',
                name: 'difficulty_sign',
                type: 'bool',
            }),
        )
        app.save(routes)
        app.save(ratings)

        for (const table of ['routes', 'ratings']) {
            const rows = arrayOf(new DynamicModel({ id: '', grade_index: 0.5 }))
            app.db()
                .newQuery(
                    `SELECT id, COALESCE(grade_index, 0) AS grade_index FROM ${table}`,
                )
                .all(rows)
            for (const row of rows) {
                if (!row.grade_index) continue
                const [label] = nearest(UIAA, row.grade_index)
                const sign = label.endsWith('+')
                    ? '+'
                    : label.endsWith('-')
                      ? '-'
                      : ''
                const level = Number(sign ? label.slice(0, -1) : label)
                const signValue =
                    table === 'routes'
                        ? sign
                            ? JSON.stringify(sign)
                            : 'null'
                        : sign === '+'
                          ? 1
                          : 0
                app.db()
                    .newQuery(
                        `UPDATE ${table} SET difficulty = {:level}, difficulty_sign = {:sign} WHERE id = {:id}`,
                    )
                    .bind({ level, sign: signValue, id: row.id })
                    .execute()
            }
        }

        const view = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
        view.viewQuery = viewQuery(['difficulty', 'difficulty_sign'])
        app.save(view)

        routes.indexes = routes.indexes.map((index) =>
            index === ROUTES_INDEX_NEW ? ROUTES_INDEX_OLD : index,
        )
        removeFields(routes, ['grade', 'grade_system', 'grade_index'])
        app.save(routes)
        removeFields(ratings, ['grade', 'grade_system', 'grade_index'])
        app.save(ratings)
    },
)
