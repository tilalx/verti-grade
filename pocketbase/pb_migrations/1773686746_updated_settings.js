/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')

        // add field
        collection.fields.addAt(
            7,
            new Field({
                autogeneratePattern: '',
                hidden: false,
                id: 'text1730822299',
                max: 50,
                min: 0,
                name: 'organization_name',
                pattern: '',
                presentable: false,
                primaryKey: false,
                required: false,
                system: false,
                type: 'text',
            }),
        )

        // add field
        collection.fields.addAt(
            8,
            new Field({
                autogeneratePattern: '',
                hidden: false,
                id: 'text3939648858',
                max: 50,
                min: 0,
                name: 'organization_unit_name',
                pattern: '',
                presentable: false,
                primaryKey: false,
                required: false,
                system: false,
                type: 'text',
            }),
        )

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('68oae2zwn6jtsd4')

        // remove field
        collection.fields.removeById('text1730822299')

        // remove field
        collection.fields.removeById('text3939648858')

        return app.save(collection)
    },
)
