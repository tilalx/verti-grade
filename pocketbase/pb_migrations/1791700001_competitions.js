/// <reference path="../pb_data/types.d.ts" />
const MANAGE = '@request.auth.role.permissions.name ?= "manage_competitions"'
const VISIBLE_COMPETITION = `competition.status != "draft" || ${MANAGE}`
const OWN_ENTRY = '@request.auth.id != "" && user = @request.auth.id'

const idField = {
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
}

function timestamps(prefix) {
    return [
        {
            id: `autodate_${prefix}_created`,
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
        },
        {
            id: `autodate_${prefix}_updated`,
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
        },
    ]
}

function relation(prefix, name, collectionId, options = {}) {
    return {
        id: `relation_${prefix}_${name}`,
        name,
        type: 'relation',
        collectionId,
        cascadeDelete: true,
        maxSelect: 1,
        required: true,
        ...options,
    }
}

function grantPermission(app, roleName, permissionId) {
    const role = app.findFirstRecordByData(
        'roles_collection_id',
        'name',
        roleName,
    )
    const permissionIds = role.get('permissions') || []
    if (!permissionIds.includes(permissionId)) {
        role.set('permissions', [...permissionIds, permissionId])
        app.save(role)
    }
}

migrate(
    (app) => {
        const competitions = new Collection({
            id: 'competitions_col_id',
            name: 'competitions',
            type: 'base',
            listRule: `status != "draft" || ${MANAGE}`,
            viewRule: `status != "draft" || ${MANAGE}`,
            createRule: MANAGE,
            updateRule: MANAGE,
            deleteRule: MANAGE,
            fields: [
                idField,
                {
                    id: 'text_competitions_name',
                    name: 'name',
                    type: 'text',
                    max: 200,
                    required: true,
                    presentable: true,
                },
                {
                    id: 'text_competitions_description',
                    name: 'description',
                    type: 'text',
                    max: 5000,
                },
                relation(
                    'competitions',
                    'location',
                    app.findCollectionByNameOrId('locations').id,
                    { cascadeDelete: false },
                ),
                {
                    id: 'select_competitions_status',
                    name: 'status',
                    type: 'select',
                    maxSelect: 1,
                    required: true,
                    values: ['draft', 'open', 'closed', 'published'],
                },
                {
                    id: 'date_competitions_starts_at',
                    name: 'starts_at',
                    type: 'date',
                    required: true,
                },
                {
                    id: 'date_competitions_ends_at',
                    name: 'ends_at',
                    type: 'date',
                    required: true,
                },
                {
                    id: 'select_competitions_scoring_format',
                    name: 'scoring_format',
                    type: 'select',
                    maxSelect: 1,
                    required: true,
                    values: ['dynamic', 'fixed', 'ifsc'],
                },
                {
                    id: 'json_competitions_scoring',
                    name: 'scoring',
                    type: 'json',
                    maxSize: 2000,
                },
                {
                    id: 'bool_competitions_live_ranking',
                    name: 'live_ranking',
                    type: 'bool',
                },
                {
                    id: 'number_competitions_freeze_minutes',
                    name: 'freeze_minutes',
                    type: 'number',
                    min: 0,
                    max: 600,
                    onlyInt: true,
                },
                ...timestamps('competitions'),
            ],
            indexes: [
                'CREATE INDEX `idx_competitions_status` ON `competitions` (`status`)',
                'CREATE INDEX `idx_competitions_starts_at` ON `competitions` (`starts_at`)',
            ],
        })
        app.save(competitions)

        const categories = new Collection({
            id: 'competition_categories_col_id',
            name: 'competition_categories',
            type: 'base',
            listRule: VISIBLE_COMPETITION,
            viewRule: VISIBLE_COMPETITION,
            createRule: MANAGE,
            updateRule: MANAGE,
            deleteRule: MANAGE,
            fields: [
                idField,
                relation('categories', 'competition', competitions.id),
                {
                    id: 'text_categories_name',
                    name: 'name',
                    type: 'text',
                    max: 100,
                    required: true,
                    presentable: true,
                },
                {
                    id: 'select_categories_gender',
                    name: 'gender',
                    type: 'select',
                    maxSelect: 1,
                    values: ['female', 'male'],
                },
                {
                    id: 'number_categories_min_birth_year',
                    name: 'min_birth_year',
                    type: 'number',
                    onlyInt: true,
                },
                {
                    id: 'number_categories_max_birth_year',
                    name: 'max_birth_year',
                    type: 'number',
                    onlyInt: true,
                },
                {
                    id: 'number_categories_sort',
                    name: 'sort',
                    type: 'number',
                    onlyInt: true,
                },
                ...timestamps('categories'),
            ],
            indexes: [
                'CREATE INDEX `idx_competition_categories_competition` ON `competition_categories` (`competition`)',
            ],
        })
        app.save(categories)

        const boulders = new Collection({
            id: 'competition_boulders_col_id',
            name: 'competition_boulders',
            type: 'base',
            listRule: VISIBLE_COMPETITION,
            viewRule: VISIBLE_COMPETITION,
            createRule: MANAGE,
            updateRule: MANAGE,
            deleteRule: MANAGE,
            fields: [
                idField,
                relation('boulders', 'competition', competitions.id),
                relation(
                    'boulders',
                    'route',
                    app.findCollectionByNameOrId('routes').id,
                ),
                {
                    id: 'number_boulders_number',
                    name: 'number',
                    type: 'number',
                    min: 1,
                    onlyInt: true,
                    required: true,
                },
                {
                    id: 'number_boulders_points',
                    name: 'points',
                    type: 'number',
                    min: 0,
                },
                { id: 'bool_boulders_zone', name: 'zone', type: 'bool' },
                { id: 'bool_boulders_voided', name: 'voided', type: 'bool' },
                ...timestamps('boulders'),
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_competition_boulders_route` ON `competition_boulders` (`competition`, `route`)',
                'CREATE UNIQUE INDEX `idx_competition_boulders_number` ON `competition_boulders` (`competition`, `number`)',
            ],
        })
        app.save(boulders)

        const entries = new Collection({
            id: 'competition_entries_col_id',
            name: 'competition_entries',
            type: 'base',
            listRule: `${MANAGE} || (${OWN_ENTRY}) || (competition.status != "draft" && hidden = false)`,
            viewRule: `${MANAGE} || (${OWN_ENTRY}) || (competition.status != "draft" && hidden = false)`,
            createRule: '@request.auth.id != ""',
            updateRule: `${MANAGE} || (${OWN_ENTRY})`,
            deleteRule: `${MANAGE} || (${OWN_ENTRY})`,
            fields: [
                idField,
                relation('entries', 'competition', competitions.id),
                relation('entries', 'user', '_pb_users_auth_'),
                relation('entries', 'category', categories.id, {
                    cascadeDelete: false,
                }),
                {
                    id: 'number_entries_bib',
                    name: 'bib',
                    type: 'number',
                    min: 1,
                    onlyInt: true,
                },
                {
                    id: 'text_entries_display_name',
                    name: 'display_name',
                    type: 'text',
                    max: 60,
                    required: true,
                    presentable: true,
                },
                {
                    id: 'number_entries_birth_year',
                    name: 'birth_year',
                    type: 'number',
                    onlyInt: true,
                    required: true,
                },
                { id: 'bool_entries_hidden', name: 'hidden', type: 'bool' },
                {
                    id: 'bool_entries_guardian_consent',
                    name: 'guardian_consent',
                    type: 'bool',
                },
                {
                    id: 'select_entries_status',
                    name: 'status',
                    type: 'select',
                    maxSelect: 1,
                    required: true,
                    values: [
                        'registered',
                        'checked_in',
                        'disqualified',
                        'withdrawn',
                    ],
                },
                ...timestamps('entries'),
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_competition_entries_user` ON `competition_entries` (`competition`, `user`)',
                'CREATE UNIQUE INDEX `idx_competition_entries_bib` ON `competition_entries` (`competition`, `bib`)',
            ],
        })
        app.save(entries)

        const scores = new Collection({
            id: 'competition_scores_col_id',
            name: 'competition_scores',
            type: 'base',
            listRule: `${MANAGE} || entry.user = @request.auth.id || competition.status = "published" || (competition.status != "draft" && competition.live_ranking = true)`,
            viewRule: `${MANAGE} || entry.user = @request.auth.id || competition.status = "published" || (competition.status != "draft" && competition.live_ranking = true)`,
            createRule: `${MANAGE} || (@request.auth.id != "" && entry.user = @request.auth.id)`,
            updateRule: `${MANAGE} || (@request.auth.id != "" && entry.user = @request.auth.id)`,
            deleteRule: MANAGE,
            fields: [
                idField,
                relation('scores', 'competition', competitions.id),
                relation('scores', 'entry', entries.id),
                relation('scores', 'boulder', boulders.id),
                {
                    id: 'number_scores_attempts',
                    name: 'attempts',
                    type: 'number',
                    min: 0,
                    max: 999,
                    onlyInt: true,
                },
                {
                    id: 'number_scores_zone_attempt',
                    name: 'zone_attempt',
                    type: 'number',
                    min: 0,
                    max: 999,
                    onlyInt: true,
                },
                {
                    id: 'number_scores_top_attempt',
                    name: 'top_attempt',
                    type: 'number',
                    min: 0,
                    max: 999,
                    onlyInt: true,
                },
                ...timestamps('scores'),
            ],
            indexes: [
                'CREATE UNIQUE INDEX `idx_competition_scores_entry_boulder` ON `competition_scores` (`entry`, `boulder`)',
                'CREATE INDEX `idx_competition_scores_competition` ON `competition_scores` (`competition`)',
            ],
        })
        app.save(scores)

        const permission = new Record(
            app.findCollectionByNameOrId('permissions_col_id'),
        )
        permission.set('name', 'manage_competitions')
        permission.set('label', 'Manage Competitions')
        app.save(permission)
        grantPermission(app, 'admin', permission.id)
        grantPermission(app, 'routesetter', permission.id)
    },
    (app) => {
        const permission = app.findFirstRecordByData(
            'permissions_col_id',
            'name',
            'manage_competitions',
        )
        for (const role of app.findAllRecords('roles_collection_id')) {
            const permissionIds = role.get('permissions') || []
            if (permissionIds.includes(permission.id)) {
                role.set(
                    'permissions',
                    permissionIds.filter((id) => id !== permission.id),
                )
                app.save(role)
            }
        }
        app.delete(permission)

        for (const id of [
            'competition_scores_col_id',
            'competition_entries_col_id',
            'competition_boulders_col_id',
            'competition_categories_col_id',
            'competitions_col_id',
        ]) {
            app.delete(app.findCollectionByNameOrId(id))
        }
    },
)
