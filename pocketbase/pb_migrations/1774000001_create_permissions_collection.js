/// <reference path="../pb_data/types.d.ts" />
migrate(
    (app) => {
        const collection = new Collection({
            createRule: null,
            deleteRule: null,
            fields: [
                {
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    id: 'text3208210256',
                    max: 15,
                    min: 15,
                    name: 'id',
                    pattern: '^[a-z0-9]+$',
                    presentable: false,
                    primaryKey: true,
                    required: true,
                    system: true,
                    type: 'text',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_perm_name',
                    max: 50,
                    min: 1,
                    name: 'name',
                    pattern: '^[a-z_]+$',
                    presentable: true,
                    primaryKey: false,
                    required: true,
                    system: false,
                    type: 'text',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_perm_label',
                    max: 100,
                    min: 1,
                    name: 'label',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: true,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'autodate_perm_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
                {
                    hidden: false,
                    id: 'autodate_perm_updated',
                    name: 'updated',
                    onCreate: true,
                    onUpdate: true,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
            ],
            id: 'permissions_col_id',
            indexes: [
                'CREATE UNIQUE INDEX `idx_permissions_name` ON `permissions` (`name`)',
            ],
            listRule: '@request.auth.id != ""',
            name: 'permissions',
            system: false,
            type: 'base',
            updateRule: null,
            viewRule: '@request.auth.id != ""',
        })

        app.save(collection)

        // Re-fetch the collection so Record gets proper context
        const savedCollection = app.findCollectionByNameOrId('permissions_col_id')

        // Seed the 8 features
        const features = [
            { name: 'manage_routes', label: 'Manage Routes' },
            { name: 'view_analytics', label: 'View Analytics' },
            { name: 'manage_comments', label: 'Manage Comments' },
            { name: 'manage_users', label: 'Manage Users' },
            { name: 'manage_settings', label: 'Manage Settings' },
            { name: 'run_inventory', label: 'Run Inventory' },
        ]

        for (const feature of features) {
            const record = new Record(savedCollection)
            record.set('name', feature.name)
            record.set('label', feature.label)
            app.save(record)
        }
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('permissions_col_id')
        app.delete(collection)
    },
)
