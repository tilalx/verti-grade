/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        // Add tenant_id indexes for collections that filter by tenant on every query.
        const collections = ['routes', 'ratings', 'locations', 'settings', 'tenant_users']
        for (const name of collections) {
            try {
                const col = app.findCollectionByNameOrId(name)
                const indexName = `idx_${name}_tenant_id`
                const already = (col.indexes ?? []).some((i) => i.includes(indexName))
                if (!already) {
                    col.indexes = [...(col.indexes ?? []), `CREATE INDEX ${indexName} ON ${name} (tenant_id)`]
                    app.save(col)
                }
            } catch (e) {
                // collection may not exist on older installs, skip
            }
        }
    },
    (app) => {
        // Drop the indexes added above
        const collections = ['routes', 'ratings', 'locations', 'settings', 'tenant_users']
        for (const name of collections) {
            try {
                const col = app.findCollectionByNameOrId(name)
                const indexName = `idx_${name}_tenant_id`
                col.indexes = (col.indexes ?? []).filter((i) => !i.includes(indexName))
                app.save(col)
            } catch (_) {}
        }
    },
)
