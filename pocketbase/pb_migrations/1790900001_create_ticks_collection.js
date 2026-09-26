/// <reference path="../pb_data/types.d.ts" />
const OWNER = '@request.auth.id != "" && user = @request.auth.id'
const LOCKED_FIELDS = ['user', 'route', 'grade', 'grade_system', 'grade_index']

migrate(
    (app) => {
        const collection = new Collection({
            id: 'ticks_col_id',
            name: 'ticks',
            type: 'base',
            system: false,
            listRule: OWNER,
            viewRule: OWNER,
            createRule:
                '@request.auth.id != "" && @request.body.user = @request.auth.id && @request.body.route != ""',
            updateRule: [
                OWNER,
                ...LOCKED_FIELDS.map(
                    (name) => `@request.body.${name}:changed = false`,
                ),
            ].join(' && '),
            deleteRule: OWNER,
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
                    cascadeDelete: true,
                    collectionId: '_pb_users_auth_',
                    id: 'relation_tick_user',
                    maxSelect: 1,
                    name: 'user',
                    required: true,
                    type: 'relation',
                },
                {
                    cascadeDelete: false,
                    collectionId: 'qr2b04qe5l99ax6',
                    id: 'relation_tick_route',
                    maxSelect: 1,
                    name: 'route',
                    required: false,
                    type: 'relation',
                },
                {
                    id: 'select_tick_type',
                    maxSelect: 1,
                    name: 'type',
                    required: true,
                    type: 'select',
                    values: ['flash', 'top', 'attempt'],
                },
                {
                    id: 'number_tick_attempts',
                    max: 999,
                    min: 1,
                    name: 'attempts',
                    onlyInt: true,
                    required: true,
                    type: 'number',
                },
                {
                    id: 'date_tick_date',
                    name: 'date',
                    required: true,
                    type: 'date',
                },
                {
                    id: 'text_tick_note',
                    max: 500,
                    name: 'note',
                    type: 'text',
                },
                {
                    id: 'text_tick_grade',
                    max: 20,
                    name: 'grade',
                    type: 'text',
                },
                {
                    id: 'text_tick_grade_system',
                    max: 30,
                    name: 'grade_system',
                    type: 'text',
                },
                {
                    id: 'number_tick_grade_index',
                    max: 40,
                    min: 0,
                    name: 'grade_index',
                    type: 'number',
                },
                {
                    id: 'autodate_tick_created',
                    name: 'created',
                    onCreate: true,
                    onUpdate: false,
                    type: 'autodate',
                },
                {
                    id: 'autodate_tick_updated',
                    name: 'updated',
                    onCreate: true,
                    onUpdate: true,
                    type: 'autodate',
                },
            ],
            indexes: [
                'CREATE INDEX `idx_ticks_user_date` ON `ticks` (`user`, `date`)',
                'CREATE INDEX `idx_ticks_user_route` ON `ticks` (`user`, `route`)',
            ],
        })

        app.save(collection)
    },
    (app) => {
        app.delete(app.findCollectionByNameOrId('ticks_col_id'))
    },
)
