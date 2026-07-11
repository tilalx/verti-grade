/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Indexes for the ratings collection: the admin comments page sorts
        // and filters on created/rating and joins routes via route_id.
        const ratings = app.findCollectionByNameOrId('ratings')
        const wanted = [
            'CREATE INDEX `idx_ratings_created` ON `ratings` (`created`)',
            'CREATE INDEX `idx_ratings_rating` ON `ratings` (`rating`)',
            'CREATE INDEX `idx_ratings_route_id` ON `ratings` (`route_id`)',
        ]
        const existing = ratings.indexes || []
        for (const idx of wanted) {
            if (!existing.includes(idx)) existing.push(idx)
        }
        ratings.indexes = existing
        app.save(ratings)

        // Enable the batch API so bulk deletes are a single request.
        const settings = app.settings()
        settings.batch.enabled = true
        settings.batch.maxRequests = 200
        settings.batch.timeout = 10
        app.save(settings)
    },
    (app) => {
        const ratings = app.findCollectionByNameOrId('ratings')
        ratings.indexes = (ratings.indexes || []).filter(
            (idx) =>
                !idx.includes('idx_ratings_created') &&
                !idx.includes('idx_ratings_rating') &&
                !idx.includes('idx_ratings_route_id'),
        )
        app.save(ratings)

        const settings = app.settings()
        settings.batch.enabled = false
        app.save(settings)
    },
)
