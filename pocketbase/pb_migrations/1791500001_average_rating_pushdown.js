/// <reference path="../pb_data/types.d.ts" />
const AVERAGE_RATING_VIEW = 'vcfw600rzblhed3'
const ROUTES_INDEX =
    'CREATE INDEX `idx_routes_archived_location` ON `routes` (`archived`, `location`)'
const RATINGS_INDEX =
    'CREATE INDEX `idx_ratings_route_rating` ON `ratings` (`route_id`, `rating`)'
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
    'wall',
    'wall_position',
]

const selectColumns = VIEW_COLUMNS.map(
    (column) => `    routes.${column},\n`,
).join('')

const correlatedQuery =
    'SELECT\n' +
    selectColumns +
    '    CAST((SELECT AVG(NULLIF(r.rating, 0)) FROM ratings r WHERE r.route_id = routes.id) AS REAL) AS average_rating,\n' +
    '    CAST((SELECT COUNT(NULLIF(r.rating, 0)) FROM ratings r WHERE r.route_id = routes.id) AS INTEGER) AS ratings_count\n' +
    'FROM routes'

const groupedQuery =
    'SELECT\n' +
    selectColumns +
    '    CAST(AVG(NULLIF(ratings.rating, 0)) AS REAL) AS average_rating,\n' +
    '    COUNT(NULLIF(ratings.rating, 0)) AS ratings_count\n' +
    'FROM routes\n' +
    'LEFT JOIN ratings ON routes.id = ratings.route_id\n' +
    'GROUP BY routes.id'

function setIndex(app, collectionName, index, present) {
    const collection = app.findCollectionByNameOrId(collectionName)
    const others = (collection.indexes || []).filter((idx) => idx !== index)
    collection.indexes = present ? [...others, index] : others
    app.save(collection)
}

function apply(app, pushdown) {
    setIndex(app, 'routes', ROUTES_INDEX, pushdown)
    setIndex(app, 'ratings', RATINGS_INDEX, pushdown)
    const view = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
    view.viewQuery = pushdown ? correlatedQuery : groupedQuery
    app.save(view)
}

migrate(
    (app) => apply(app, true),
    (app) => apply(app, false),
)
