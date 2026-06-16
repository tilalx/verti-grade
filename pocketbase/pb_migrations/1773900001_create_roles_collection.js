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
                    id: 'text_role_name',
                    max: 50,
                    min: 1,
                    name: 'name',
                    pattern: '',
                    presentable: true,
                    primaryKey: false,
                    required: true,
                    system: false,
                    type: 'text',
                },
                {
                    autogeneratePattern: '',
                    hidden: false,
                    id: 'text_role_desc',
                    max: 200,
                    min: 0,
                    name: 'description',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: false,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'autodate_roles_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
                {
                    hidden: false,
                    id: 'autodate_roles_updated',
                    name: 'updated',
                    onCreate: true,
                    onUpdate: true,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
            ],
            id: 'roles_collection_id',
            indexes: [
                'CREATE UNIQUE INDEX `idx_roles_name` ON `roles` (`name`)',
            ],
            listRule: '@request.auth.id != ""',
            name: 'roles',
            system: false,
            type: 'base',
            updateRule: null,
            viewRule: '@request.auth.id != ""',
        })

        app.save(collection)

        // Re-fetch the collection so Record gets proper context
        const savedCollection = app.findCollectionByNameOrId(
            'roles_collection_id',
        )

        // Seed default roles
        const adminRole = new Record(savedCollection)
        adminRole.set('name', 'admin')
        adminRole.set('description', 'Full access to all features')
        app.save(adminRole)

        const userRole = new Record(savedCollection)
        userRole.set('name', 'user')
        userRole.set('description', 'Standard user access')
        app.save(userRole)
    },
    (app) => {
        const collection = app.findCollectionByNameOrId('roles_collection_id')
        app.delete(collection)
    },
)
