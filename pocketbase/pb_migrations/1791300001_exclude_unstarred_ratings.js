/// <reference path="../pb_data/types.d.ts" />
const AVERAGE_RATING_VIEW = 'vcfw600rzblhed3'
const RATINGS_STATS_VIEW = 'pbc_1783803502'
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

function averageRatingQuery(starsOnly) {
    const stars = starsOnly ? 'NULLIF(ratings.rating, 0)' : 'ratings.rating'
    const counted = starsOnly ? stars : 'ratings.id'
    return (
        'SELECT\n' +
        VIEW_COLUMNS.map((column) => `    routes.${column},\n`).join('') +
        `    CAST(AVG(${stars}) AS REAL) AS average_rating,\n` +
        `    COUNT(${counted}) AS ratings_count\n` +
        'FROM routes\n' +
        'LEFT JOIN ratings ON routes.id = ratings.route_id\n' +
        'GROUP BY routes.id'
    )
}

function ratingsStatsQuery(starsOnly) {
    const stars = starsOnly ? 'NULLIF(rating, 0)' : 'rating'
    return (
        'SELECT\n' +
        "    'stats' AS id,\n" +
        '    COUNT(id) AS totalReviews,\n' +
        `    ROUND(AVG(${stars}), 1) AS avgRating,\n` +
        `    SUM(${stars} IS NOT NULL AND ${stars} <= 2) AS lowRated,\n` +
        "    SUM(created >= datetime('now', '-7 days')) AS thisWeek\n" +
        'FROM ratings;'
    )
}

function setQueries(app, starsOnly) {
    const averageRating = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
    averageRating.viewQuery = averageRatingQuery(starsOnly)
    app.save(averageRating)

    const stats = app.findCollectionByNameOrId(RATINGS_STATS_VIEW)
    stats.viewQuery = ratingsStatsQuery(starsOnly)
    app.save(stats)
}

migrate(
    (app) => setQueries(app, true),
    (app) => setQueries(app, false),
)
