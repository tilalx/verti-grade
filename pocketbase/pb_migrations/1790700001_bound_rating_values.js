/// <reference path="../pb_data/types.d.ts" />
const BOUNDS = { rating: [0, 5], grade_index: [0, 40] }

migrate(
    (app) => {
        app.db()
            .newQuery('DELETE FROM ratings WHERE rating < 0 OR rating > 5')
            .execute()
        app.db()
            .newQuery(
                'UPDATE ratings SET grade_index = 0 WHERE grade_index < 0 OR grade_index > 40',
            )
            .execute()

        const ratings = app.findCollectionByNameOrId('ratings')
        for (const [name, [min, max]] of Object.entries(BOUNDS)) {
            const field = ratings.fields.getByName(name)
            field.min = min
            field.max = max
        }
        app.save(ratings)
    },
    (app) => {
        const ratings = app.findCollectionByNameOrId('ratings')
        for (const name of Object.keys(BOUNDS)) {
            const field = ratings.fields.getByName(name)
            field.min = null
            field.max = null
        }
        app.save(ratings)
    },
)
