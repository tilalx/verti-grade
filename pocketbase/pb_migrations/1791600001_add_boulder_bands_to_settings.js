/// <reference path="../pb_data/types.d.ts" />
const FIELD = 'boulder_bands'

migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        if (!collection.fields.getByName(FIELD)) {
            collection.fields.add(
                new Field({
                    id: `json_settings_${FIELD}`,
                    name: FIELD,
                    type: 'json',
                    maxSize: 5000,
                    required: false,
                }),
            )
        }
        app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        const field = collection.fields.getByName(FIELD)
        if (field) collection.fields.removeById(field.id)
        app.save(collection)
    },
)
