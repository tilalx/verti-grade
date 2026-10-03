/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        competitions.fields.addAt(
            competitions.fields.length,
            new Field({
                id: 'bool_competitions_requires_payment',
                name: 'requires_payment',
                type: 'bool',
            }),
        )
        app.save(competitions)
    },
    (app) => {
        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        competitions.fields.removeById('bool_competitions_requires_payment')
        app.save(competitions)
    },
)
