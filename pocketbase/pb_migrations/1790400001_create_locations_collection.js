/// <reference path="../pb_data/types.d.ts" />
const MANAGE_SETTINGS =
    '@request.auth.role.permissions.name ?= "manage_settings"'
const AVERAGE_RATING_VIEW = 'vcfw600rzblhed3'

function withoutLocationInView(app, change) {
    const view = app.findCollectionByNameOrId(AVERAGE_RATING_VIEW)
    const query = view.viewQuery
    view.viewQuery = query.replace('    routes.location,\n', '')
    app.save(view)
    change()
    view.viewQuery = query
    app.save(view)
}

migrate(
    (app) => {
        const locations = new Collection({
            id: 'pbc_locations',
            name: 'locations',
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
                    id: 'text_locations_name',
                    max: 100,
                    min: 1,
                    name: 'name',
                    presentable: true,
                    required: true,
                    type: 'text',
                },
                {
                    id: 'autodate_locations_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    type: 'autodate',
                },
                {
                    id: 'autodate_locations_updated',
                    name: 'updated',
                    onCreate: true,
                    onUpdate: true,
                    type: 'autodate',
                },
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_locations_name` ON `locations` (`name` COLLATE NOCASE)',
            ],
        })
        app.save(locations)

        const existingNames = arrayOf(new DynamicModel({ location: '' }))
        app.db()
            .newQuery(
                "SELECT DISTINCT location FROM routes WHERE location != '' ORDER BY location",
            )
            .all(existingNames)

        const routes = app.findCollectionByNameOrId('routes')
        routes.fields.add(
            new Field({
                id: 'relation_routes_location',
                name: 'location_ref',
                type: 'relation',
                collectionId: locations.id,
                cascadeDelete: false,
                maxSelect: 1,
                minSelect: 0,
                required: false,
            }),
        )
        app.save(routes)

        for (const { location: name } of existingNames) {
            const record = new Record(locations)
            record.set('name', name)
            app.save(record)
            app.db()
                .newQuery(
                    'UPDATE routes SET location_ref = {:id} WHERE location = {:name}',
                )
                .bind({ id: record.id, name })
                .execute()
        }

        withoutLocationInView(app, () => {
            routes.fields.removeById(routes.fields.getByName('location').id)
            app.save(routes)
            routes.fields.getByName('location_ref').name = 'location'
            app.save(routes)
        })
    },
    (app) => {
        const routes = app.findCollectionByNameOrId('routes')
        const names = arrayOf(new DynamicModel({ id: '', name: '' }))
        app.db().newQuery('SELECT id, name FROM locations').all(names)

        withoutLocationInView(app, () => {
            routes.fields.getByName('location').name = 'location_ref'
            app.save(routes)
            routes.fields.add(
                new Field({
                    id: 'sypedztv',
                    name: 'location',
                    type: 'select',
                    maxSelect: 1,
                    values: names.length
                        ? names.map((n) => n.name)
                        : ['Default'],
                    required: false,
                }),
            )
            app.save(routes)
            app.db()
                .newQuery(
                    "UPDATE routes SET location = COALESCE((SELECT name FROM locations WHERE locations.id = routes.location_ref), '')",
                )
                .execute()
            routes.fields.removeById(routes.fields.getByName('location_ref').id)
            app.save(routes)
        })
        app.delete(app.findCollectionByNameOrId('locations'))
    },
)
