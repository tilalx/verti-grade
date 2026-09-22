/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const collection = new Collection({
            createRule: null,
            deleteRule: null,
            listRule: null,
            updateRule: null,
            viewRule: null,
            id: 'cap_nonces_col_id',
            name: 'cap_nonces',
            system: false,
            type: 'base',
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
                    id: 'text_cap_jti',
                    max: 128,
                    min: 1,
                    name: 'jti',
                    pattern: '',
                    presentable: false,
                    primaryKey: false,
                    required: true,
                    system: false,
                    type: 'text',
                },
                {
                    hidden: false,
                    id: 'autodate_cap_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    presentable: false,
                    system: false,
                    type: 'autodate',
                },
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_cap_nonces_jti` ON `cap_nonces` (`jti`)',
                'CREATE INDEX `idx_cap_nonces_created` ON `cap_nonces` (`created`)',
            ],
        })

        app.save(collection)
    },
    (app) => {
        app.delete(app.findCollectionByNameOrId('cap_nonces_col_id'))
    },
)
