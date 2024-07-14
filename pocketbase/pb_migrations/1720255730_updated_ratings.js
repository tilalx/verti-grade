/// <reference path="../pb_data/types.d.ts" />
migrate(
    (db) => {
        const dao = new Dao(db)
        const collection = dao.findCollectionByNameOrId('mgqsaf0qt5436zq')

        // add
        collection.schema.addField(
            new SchemaField({
                system: false,
                id: 'fsavjowo',
                name: 'difficulty',
                type: 'number',
                required: true,
                presentable: false,
                unique: false,
                options: {
                    min: 0,
                    max: 10,
                    noDecimal: false,
                },
            }),
        )

        // update
        collection.schema.addField(
            new SchemaField({
                system: false,
                id: '5hhk9pqj',
                name: 'route_id',
                type: 'relation',
                required: true,
                presentable: false,
                unique: false,
                options: {
                    collectionId: 'qr2b04qe5l99ax6',
                    cascadeDelete: true,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: null,
                },
            }),
        )

        return dao.saveCollection(collection)
    },
    (db) => {
        const dao = new Dao(db)
        const collection = dao.findCollectionByNameOrId('mgqsaf0qt5436zq')

        // remove
        collection.schema.removeField('fsavjowo')

        // update
        collection.schema.addField(
            new SchemaField({
                system: false,
                id: '5hhk9pqj',
                name: 'route_id',
                type: 'relation',
                required: false,
                presentable: false,
                unique: false,
                options: {
                    collectionId: 'qr2b04qe5l99ax6',
                    cascadeDelete: true,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: null,
                },
            }),
        )

        return dao.saveCollection(collection)
    },
)
