/// <reference path="../pb_data/types.d.ts" />
const TEXT_FIELDS = [
    'legal_address',
    'legal_phone',
    'legal_register',
    'legal_vat_id',
    'legal_editorial',
]
const REPRESENTATIVES_FIELD = 'legal_representatives'
const OBSOLETE_FIELDS = ['legal_representative']

migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')

        for (const name of OBSOLETE_FIELDS) {
            const field = collection.fields.getByName(name)
            if (field) collection.fields.removeById(field.id)
        }

        for (const name of TEXT_FIELDS) {
            if (collection.fields.getByName(name)) continue
            collection.fields.add(
                new Field({
                    id: `text_settings_${name}`,
                    name,
                    type: 'text',
                    max: 1000,
                    required: false,
                }),
            )
        }

        if (!collection.fields.getByName(REPRESENTATIVES_FIELD)) {
            collection.fields.add(
                new Field({
                    id: `json_settings_${REPRESENTATIVES_FIELD}`,
                    name: REPRESENTATIVES_FIELD,
                    type: 'json',
                    maxSize: 20000,
                    required: false,
                }),
            )
        }

        app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')
        for (const name of [...TEXT_FIELDS, REPRESENTATIVES_FIELD]) {
            const field = collection.fields.getByName(name)
            if (field) collection.fields.removeById(field.id)
        }
        app.save(collection)
    },
)
