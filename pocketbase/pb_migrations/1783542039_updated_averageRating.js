/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = app.findCollectionByNameOrId('vcfw600rzblhed3')

        collection.viewQuery =
            'SELECT\n' +
            '    routes.id,\n' +
            '    routes.name,\n' +
            '    routes.color,\n' +
            '    routes.difficulty,\n' +
            '    routes.difficulty_sign,\n' +
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

        return app.save(collection)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('vcfw600rzblhed3')

        collection.viewQuery =
            'SELECT \n' +
            '    routes.id,\n' +
            '    routes.name,\n' +
            '    AVG(ratings.rating) AS average_rating\n' +
            'FROM \n' +
            '    routes\n' +
            'LEFT JOIN \n' +
            '    ratings ON routes.id = ratings.route_id\n' +
            'GROUP BY \n' +
            '    routes.id;'

        return app.save(collection)
    },
)
