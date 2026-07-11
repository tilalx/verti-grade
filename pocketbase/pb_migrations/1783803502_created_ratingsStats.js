/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Single-row aggregate view so the admin comments page can fetch its
        // header stats in one tiny request instead of the full collection.
        const collection = new Collection({
            createRule: null,
            deleteRule: null,
            fields: [
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text3208210256',
                    max: 0,
                    min: 0,
                    name: 'id',
                    pattern: '^[a-z0-9]+$',
                    presentable: false,
                    primaryKey: true,
                    required: true,
                    system: true,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'number2325549941',
                    max: null,
                    min: null,
                    name: 'totalReviews',
                    onlyInt: false,
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'number',
                },
                {
                    hidden: false,
                    id: 'json1712910400',
                    maxSize: 1,
                    name: 'avgRating',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'json',
                },
                {
                    hidden: false,
                    id: 'json1204091971',
                    maxSize: 1,
                    name: 'lowRated',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'json',
                },
                {
                    hidden: false,
                    id: 'json3846034815',
                    maxSize: 1,
                    name: 'thisWeek',
                    presentable: false,
                    required: false,
                    system: false,
                    type: 'json',
                },
            ],
            id: 'pbc_1783803502',
            indexes: [],
            listRule: '',
            name: 'ratingsStats',
            system: false,
            type: 'view',
            updateRule: null,
            viewQuery:
                'SELECT\n' +
                "    'stats' AS id,\n" +
                '    COUNT(id) AS totalReviews,\n' +
                '    ROUND(AVG(rating), 1) AS avgRating,\n' +
                '    SUM(rating IS NOT NULL AND rating <= 2) AS lowRated,\n' +
                "    SUM(created >= datetime('now', '-7 days')) AS thisWeek\n" +
                'FROM ratings;',
            viewRule: '',
        })

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('pbc_1783803502')

        return app.delete(collection)
    },
)
