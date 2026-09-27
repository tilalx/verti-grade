/// <reference path="../pb_data/types.d.ts" />
const MANAGE_SETTINGS =
    '@request.auth.role.permissions.name ?= "manage_settings"'
const AVERAGE_RATING_VIEW = 'vcfw600rzblhed3'
const VIEW_COLUMNS = [
    'id',
    'name',
    'color',
    'grade',
    'grade_system',
    'grade_index',
    'anchor_point',
    'location',
    'type',
    'comment',
    'creator',
    'archived',
    'screw_date',
    'created',
    'updated',
]

function averageRatingQuery(columns) {
    return (
        'SELECT\n' +
        columns.map((column) => `    routes.${column},\n`).join('') +
        '    CAST(AVG(ratings.rating) AS REAL) AS average_rating,\n' +
        '    COUNT(ratings.id) AS ratings_count\n' +
        'FROM routes\n' +
        'LEFT JOIN ratings ON routes.id = ratings.route_id\n' +
        'GROUP BY routes.id'
    )
}

function setViewColumns(app, columns) {
    const view = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
    view.viewQuery = averageRatingQuery(columns)
    app.save(view)
}

migrate(
    (app) => {
        const locations = app.findCollectionByNameOrId('locations')
        locations.fields.add(
            new Field({
                id: 'json_locations_map',
                name: 'map',
                type: 'json',
                maxSize: 200000,
            }),
            new Field({
                id: 'file_locations_map_trace',
                name: 'map_trace',
                type: 'file',
                maxSelect: 1,
                maxSize: 10485760,
                mimeTypes: [
                    'image/jpeg',
                    'image/png',
                    'image/svg+xml',
                    'image/webp',
                ],
            }),
        )
        app.save(locations)

        const walls = new Collection({
            id: 'pbc_walls',
            name: 'walls',
            type: 'base',
            system: false,
            listRule: '',
            viewRule: '',
            createRule: MANAGE_SETTINGS,
            updateRule: MANAGE_SETTINGS,
            deleteRule: MANAGE_SETTINGS,
            fields: [
                {
                    autogeneratePattern: '[a-z0-9]{15}',
                    id: 'text3208210256',
                    max: 15,
                    min: 15,
                    name: 'id',
                    pattern: '^[a-z0-9]+$',
                    primaryKey: true,
                    required: true,
                    system: true,
                    type: 'text',
                },
                {
                    id: 'relation_walls_location',
                    name: 'location',
                    type: 'relation',
                    collectionId: locations.id,
                    cascadeDelete: false,
                    maxSelect: 1,
                    minSelect: 0,
                    required: true,
                },
                {
                    id: 'text_walls_name',
                    name: 'name',
                    type: 'text',
                    min: 1,
                    max: 100,
                    presentable: true,
                    required: true,
                },
                {
                    id: 'json_walls_outline',
                    name: 'outline',
                    type: 'json',
                    maxSize: 20000,
                    required: true,
                },
                {
                    id: 'json_walls_edge',
                    name: 'edge',
                    type: 'json',
                    maxSize: 20000,
                    required: true,
                },
                {
                    id: 'json_walls_label',
                    name: 'label',
                    type: 'json',
                    maxSize: 200,
                },
                {
                    id: 'number_walls_sort',
                    name: 'sort',
                    type: 'number',
                    onlyInt: true,
                },
                {
                    id: 'autodate_walls_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    type: 'autodate',
                },
                {
                    id: 'autodate_walls_updated',
                    name: 'updated',
                    onCreate: true,
                    onUpdate: true,
                    type: 'autodate',
                },
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_walls_location_name` ON `walls` (`location`, `name` COLLATE NOCASE)',
            ],
        })
        app.save(walls)

        const routes = app.findCollectionByNameOrId('routes')
        routes.fields.add(
            new Field({
                id: 'relation_routes_wall',
                name: 'wall',
                type: 'relation',
                collectionId: walls.id,
                cascadeDelete: false,
                maxSelect: 1,
                minSelect: 0,
                required: false,
            }),
            new Field({
                id: 'number_routes_wall_position',
                name: 'wall_position',
                type: 'number',
                min: 0,
                max: 1,
                required: false,
            }),
        )
        app.save(routes)

        setViewColumns(app, [...VIEW_COLUMNS, 'wall', 'wall_position'])
    },
    (app) => {
        setViewColumns(app, VIEW_COLUMNS)

        const routes = app.findCollectionByNameOrId('routes')
        routes.fields.removeById('relation_routes_wall')
        routes.fields.removeById('number_routes_wall_position')
        app.save(routes)

        app.delete(app.findCollectionByNameOrId('pbc_walls'))

        const locations = app.findCollectionByNameOrId('locations')
        locations.fields.removeById('json_locations_map')
        locations.fields.removeById('file_locations_map_trace')
        app.save(locations)
    },
)
