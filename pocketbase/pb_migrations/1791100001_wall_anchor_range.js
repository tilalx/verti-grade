/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const walls = app.findCollectionByNameOrId('walls')
        walls.fields.add(
            new Field({
                id: 'number_walls_anchor_from',
                name: 'anchor_from',
                type: 'number',
                onlyInt: true,
                min: 0,
            }),
            new Field({
                id: 'number_walls_anchor_to',
                name: 'anchor_to',
                type: 'number',
                onlyInt: true,
                min: 0,
            }),
        )
        app.save(walls)
    },
    (app) => {
        const walls = app.findCollectionByNameOrId('walls')
        walls.fields.removeById('number_walls_anchor_from')
        walls.fields.removeById('number_walls_anchor_to')
        app.save(walls)
    },
)
