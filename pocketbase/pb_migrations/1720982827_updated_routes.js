/// <reference path="../pb_data/types.d.ts" />
migrate(
    (db) => {
        const dao = new Dao(db)
        const collection = dao.findCollectionByNameOrId('qr2b04qe5l99ax6')

        // update
        collection.schema.addField(
            new SchemaField({
                system: false,
                id: '5bpugbxm',
                name: 'difficulty_sign',
                type: 'json',
                required: false,
                presentable: false,
                unique: false,
                options: {
                    maxSize: 2000,
                },
            }),
        )

        return dao.saveCollection(collection)
    },
    (db) => {
        const dao = new Dao(db)
        const collection = dao.findCollectionByNameOrId('qr2b04qe5l99ax6')

        // update
        collection.schema.addField(
            new SchemaField({
                system: false,
                id: '5bpugbxm',
                name: 'difficulty_sign',
                type: 'json',
                required: true,
                presentable: false,
                unique: false,
                options: {
                    maxSize: 2000,
                },
            }),
        )

        return dao.saveCollection(collection)
    },
)
