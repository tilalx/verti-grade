/// <reference path="../pb_data/types.d.ts" />
const MANAGE_TASKS = '@request.auth.role.permissions.name ?= "manage_tasks"'
const TASK_RATE_LIMIT = {
    label: 'tasks:create',
    audience: '',
    duration: 3600,
    maxRequests: 10,
}

function withoutAudienceConflicts(rules) {
    const guestLabels = rules
        .filter((rule) => rule.audience === '@guest')
        .map((rule) => rule.label)
    return rules.map((rule) =>
        rule.audience === '' && guestLabels.includes(rule.label)
            ? { ...rule, audience: '@auth' }
            : rule,
    )
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
        const tasks = new Collection({
            id: 'tasks_col_id',
            name: 'tasks',
            type: 'base',
            system: false,
            listRule: MANAGE_TASKS,
            viewRule: MANAGE_TASKS,
            createRule: '',
            updateRule: MANAGE_TASKS,
            deleteRule: MANAGE_TASKS,
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
                    id: 'select_tasks_kind',
                    name: 'kind',
                    type: 'select',
                    maxSelect: 1,
                    required: true,
                    values: ['defect', 'reset', 'maintenance', 'other'],
                },
                {
                    id: 'text_tasks_title',
                    name: 'title',
                    type: 'text',
                    max: 200,
                    presentable: true,
                },
                {
                    id: 'select_tasks_category',
                    name: 'category',
                    type: 'select',
                    maxSelect: 1,
                    values: [
                        'loose_bolt',
                        'loose_hold',
                        'spinning_hold',
                        'broken_hold',
                        'damaged_volume',
                        'sharp_edge',
                        'missing_hold',
                        'label_tag',
                        'other',
                    ],
                },
                {
                    id: 'number_tasks_priority',
                    name: 'priority',
                    type: 'number',
                    min: 1,
                    max: 4,
                    onlyInt: true,
                    required: true,
                },
                {
                    id: 'select_tasks_status',
                    name: 'status',
                    type: 'select',
                    maxSelect: 1,
                    required: true,
                    values: ['open', 'in_progress', 'done', 'dismissed'],
                },
                {
                    id: 'relation_tasks_route',
                    name: 'route',
                    type: 'relation',
                    collectionId: app.findCollectionByNameOrId('routes').id,
                    cascadeDelete: true,
                    maxSelect: 1,
                },
                {
                    id: 'relation_tasks_wall',
                    name: 'wall',
                    type: 'relation',
                    collectionId: 'pbc_walls',
                    cascadeDelete: false,
                    maxSelect: 1,
                },
                {
                    id: 'relation_tasks_location',
                    name: 'location',
                    type: 'relation',
                    collectionId: app.findCollectionByNameOrId('locations').id,
                    cascadeDelete: false,
                    maxSelect: 1,
                },
                {
                    id: 'text_tasks_description',
                    name: 'description',
                    type: 'text',
                    max: 2000,
                },
                {
                    id: 'file_tasks_photo',
                    name: 'photo',
                    type: 'file',
                    maxSelect: 1,
                    maxSize: 5242880,
                    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                    thumbs: ['400x0'],
                    protected: true,
                },
                {
                    id: 'relation_tasks_reporter',
                    name: 'reporter',
                    type: 'relation',
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                },
                {
                    id: 'relation_tasks_assignee',
                    name: 'assignee',
                    type: 'relation',
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                },
                {
                    id: 'date_tasks_due_date',
                    name: 'due_date',
                    type: 'date',
                },
                {
                    id: 'text_tasks_resolution_note',
                    name: 'resolution_note',
                    type: 'text',
                    max: 1000,
                },
                {
                    id: 'date_tasks_done_at',
                    name: 'done_at',
                    type: 'date',
                },
                {
                    id: 'relation_tasks_done_by',
                    name: 'done_by',
                    type: 'relation',
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: false,
                    maxSelect: 1,
                },
                {
                    id: 'autodate_tasks_created',
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                },
                {
                    id: 'autodate_tasks_updated',
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                },
            ],
            indexes: [
                'CREATE INDEX `idx_tasks_status` ON `tasks` (`status`)',
                'CREATE INDEX `idx_tasks_location` ON `tasks` (`location`)',
                'CREATE INDEX `idx_tasks_route` ON `tasks` (`route`)',
                'CREATE INDEX `idx_tasks_assignee` ON `tasks` (`assignee`)',
                'CREATE INDEX `idx_tasks_created` ON `tasks` (`created`)',
            ],
        })
        app.save(tasks)

        const openRouteDefects = new Collection({
            id: 'open_route_defects_col_id',
            name: 'open_route_defects',
            type: 'view',
            listRule: '',
            viewRule: '',
            viewQuery:
                "SELECT id, route, category, created FROM tasks WHERE kind = 'defect' AND status IN ('open', 'in_progress') AND route != ''",
        })
        app.save(openRouteDefects)

        const taskAssignees = new Collection({
            id: 'task_assignees_col_id',
            name: 'task_assignees',
            type: 'view',
            listRule: MANAGE_TASKS,
            viewRule: MANAGE_TASKS,
            viewQuery:
                "SELECT DISTINCT users.id, COALESCE(NULLIF(users.name, ''), users.username) AS name FROM users JOIN roles ON roles.id = users.role JOIN json_each(roles.permissions) AS granted JOIN permissions ON permissions.id = granted.value WHERE permissions.name = 'manage_tasks'",
        })
        app.save(taskAssignees)

        const permission = new Record(
            app.findCollectionByNameOrId('permissions_col_id'),
        )
        permission.set('name', 'manage_tasks')
        permission.set('label', 'Manage Tasks')
        app.save(permission)
        grantPermission(app, 'admin', permission.id)
        grantPermission(app, 'routesetter', permission.id)

        const settings = app.settings()
        settings.rateLimits.rules = [
            ...withoutAudienceConflicts(settings.rateLimits.rules).filter(
                (rule) => rule.label !== TASK_RATE_LIMIT.label,
            ),
            TASK_RATE_LIMIT,
        ]
        app.save(settings)
    },
    (app) => {
        const settings = app.settings()
        settings.rateLimits.rules = withoutAudienceConflicts(
            settings.rateLimits.rules,
        ).filter((rule) => rule.label !== TASK_RATE_LIMIT.label)
        app.save(settings)

        const permission = app.findFirstRecordByData(
            'permissions_col_id',
            'name',
            'manage_tasks',
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

        app.delete(app.findCollectionByNameOrId('task_assignees_col_id'))
        app.delete(app.findCollectionByNameOrId('open_route_defects_col_id'))
        app.delete(app.findCollectionByNameOrId('tasks_col_id'))
    },
)
