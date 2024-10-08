/// <reference path="../pb_data/types.d.ts" />
migrate(
    (db) => {
        const snapshot = [
            {
                id: '_pb_users_auth_',
                created: '2024-07-05 09:57:54.951Z',
                updated: '2024-07-05 21:15:58.757Z',
                name: 'users',
                type: 'auth',
                system: false,
                schema: [
                    {
                        system: false,
                        id: 'sacypvxf',
                        name: 'firstname',
                        type: 'text',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                    {
                        system: false,
                        id: 'users_name',
                        name: 'name',
                        type: 'text',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                    {
                        system: false,
                        id: 'users_avatar',
                        name: 'avatar',
                        type: 'file',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            mimeTypes: [
                                'image/jpeg',
                                'image/png',
                                'image/svg+xml',
                                'image/gif',
                                'image/webp',
                            ],
                            thumbs: null,
                            maxSelect: 1,
                            maxSize: 5242880,
                            protected: false,
                        },
                    },
                ],
                indexes: [],
                listRule: 'id = @request.auth.id',
                viewRule: 'id = @request.auth.id',
                createRule: '',
                updateRule: 'id = @request.auth.id',
                deleteRule: 'id = @request.auth.id',
                options: {
                    allowEmailAuth: true,
                    allowOAuth2Auth: true,
                    allowUsernameAuth: true,
                    exceptEmailDomains: null,
                    manageRule: null,
                    minPasswordLength: 8,
                    onlyEmailDomains: null,
                    onlyVerified: true,
                    requireEmail: true,
                },
            },
            {
                id: 'qr2b04qe5l99ax6',
                created: '2024-07-05 10:35:51.944Z',
                updated: '2024-07-14 18:47:07.282Z',
                name: 'routes',
                type: 'base',
                system: false,
                schema: [
                    {
                        system: false,
                        id: '2vke4qt5',
                        name: 'name',
                        type: 'text',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                    {
                        system: false,
                        id: 'mahzsklp',
                        name: 'difficulty',
                        type: 'number',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            min: 0,
                            max: 10,
                            noDecimal: false,
                        },
                    },
                    {
                        system: false,
                        id: '5bpugbxm',
                        name: 'difficulty_sign',
                        type: 'json',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSize: 2000,
                        },
                    },
                    {
                        system: false,
                        id: 'sypedztv',
                        name: 'location',
                        type: 'select',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSelect: 1,
                            values: ['Hanau', 'Gelnhausen'],
                        },
                    },
                    {
                        system: false,
                        id: '2xr3jssh',
                        name: 'type',
                        type: 'select',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSelect: 1,
                            values: ['Route', 'Boulder'],
                        },
                    },
                    {
                        system: false,
                        id: '4fmli3er',
                        name: 'comment',
                        type: 'text',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                    {
                        system: false,
                        id: 'rwyzljau',
                        name: 'creator',
                        type: 'json',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSize: 2000000,
                        },
                    },
                    {
                        system: false,
                        id: '0zrmkjos',
                        name: 'archived',
                        type: 'bool',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {},
                    },
                    {
                        system: false,
                        id: 'xoaebxkr',
                        name: 'color',
                        type: 'text',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                    {
                        system: false,
                        id: 'yh8d0mqp',
                        name: 'screw_date',
                        type: 'date',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: '',
                            max: '',
                        },
                    },
                ],
                indexes: [],
                listRule: '',
                viewRule: '',
                createRule: '@request.auth.id != ""',
                updateRule: '@request.auth.id != ""',
                deleteRule: '@request.auth.id != ""',
                options: {},
            },
            {
                id: 'mgqsaf0qt5436zq',
                created: '2024-07-06 08:36:14.797Z',
                updated: '2024-07-06 08:48:50.599Z',
                name: 'ratings',
                type: 'base',
                system: false,
                schema: [
                    {
                        system: false,
                        id: '5hhk9pqj',
                        name: 'route_id',
                        type: 'relation',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            collectionId: 'qr2b04qe5l99ax6',
                            cascadeDelete: true,
                            minSelect: null,
                            maxSelect: 1,
                            displayFields: null,
                        },
                    },
                    {
                        system: false,
                        id: '9chbziwf',
                        name: 'rating',
                        type: 'number',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            noDecimal: false,
                        },
                    },
                    {
                        system: false,
                        id: 'fsavjowo',
                        name: 'difficulty',
                        type: 'number',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            min: 0,
                            max: 10,
                            noDecimal: false,
                        },
                    },
                    {
                        system: false,
                        id: 'zsqcbufz',
                        name: 'difficulty_sign',
                        type: 'bool',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {},
                    },
                    {
                        system: false,
                        id: '1y3nqcyf',
                        name: 'comment',
                        type: 'text',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: '',
                        },
                    },
                ],
                indexes: [],
                listRule: '',
                viewRule: '',
                createRule: '',
                updateRule: null,
                deleteRule: null,
                options: {},
            },
        ]

        const collections = snapshot.map((item) => new Collection(item))

        return Dao(db).importCollections(collections, true, null)
    },
    (db) => {
        return null
    },
)
