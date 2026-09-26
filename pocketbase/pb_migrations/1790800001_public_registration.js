/// <reference path="../pb_data/types.d.ts" />
const STAFF_CREATE = '@request.auth.role.permissions.name ?= "manage_users"'
const PUBLIC_SIGNUP = [
    '@request.auth.id = ""',
    '@collection.settings.allow_registration ?= true',
    '@request.body.role:isset = false',
].join(' && ')
const SIGNUP_RATE_LIMIT = {
    label: 'users:create',
    audience: '@guest',
    duration: 3600,
    maxRequests: 5,
}

migrate(
    (app) => {
        const settings = app.findCollectionByNameOrId('settings')
        if (!settings.fields.getByName('allow_registration')) {
            settings.fields.add(
                new Field({
                    id: 'bool_settings_allow_registration',
                    name: 'allow_registration',
                    type: 'bool',
                }),
            )
            app.save(settings)
        }

        const users = app.findCollectionByNameOrId('users')
        users.createRule = `${STAFF_CREATE} || (${PUBLIC_SIGNUP})`
        app.save(users)

        const appSettings = app.settings()
        const rules = appSettings.rateLimits.rules.filter(
            (rule) => rule.label !== SIGNUP_RATE_LIMIT.label,
        )
        appSettings.rateLimits.rules = [...rules, SIGNUP_RATE_LIMIT]
        app.save(appSettings)
    },
    (app) => {
        const users = app.findCollectionByNameOrId('users')
        users.createRule = STAFF_CREATE
        app.save(users)

        const settings = app.findCollectionByNameOrId('settings')
        const field = settings.fields.getByName('allow_registration')
        if (field) settings.fields.removeById(field.id)
        app.save(settings)

        const appSettings = app.settings()
        appSettings.rateLimits.rules = appSettings.rateLimits.rules.filter(
            (rule) => rule.label !== SIGNUP_RATE_LIMIT.label,
        )
        app.save(appSettings)
    },
)
