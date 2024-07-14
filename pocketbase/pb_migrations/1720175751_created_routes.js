/// <reference path="../pb_data/types.d.ts" />
migrate(
    (db) => {
        const collection = new Collection({
            id: 'qr2b04qe5l99ax6',
            created: '2024-07-05 10:35:51.944Z',
            updated: '2024-07-05 10:35:51.944Z',
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
                    id: '1bx7digw',
                    name: 'difficulty_sign',
                    type: 'bool',
                    required: false,
                    presentable: false,
                    unique: false,
                    options: {},
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
                    required: false,
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
        })

        return Dao(db).saveCollection(collection)
    },
    (db) => {
        const dao = new Dao(db)
        const collection = dao.findCollectionByNameOrId('qr2b04qe5l99ax6')

        return dao.deleteCollection(collection)
    },
)
