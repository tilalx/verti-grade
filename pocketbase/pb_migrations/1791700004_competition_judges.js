/// <reference path="../pb_data/types.d.ts" />
const MANAGE = '@request.auth.role.permissions.name ?= "manage_competitions"'
const JUDGE = '@request.auth.role.permissions.name ?= "judge_competitions"'
const OWN_ENTRY = '@request.auth.id != "" && user = @request.auth.id'
const PUBLIC_ENTRY = 'competition.status != "draft" && hidden = false'

function setEntryReadRule(app, rule) {
    const entries = app.findCollectionByNameOrId('competition_entries_col_id')
    entries.listRule = rule
    entries.viewRule = rule
    app.save(entries)
}

migrate(
    (app) =>
        setEntryReadRule(
            app,
            `${MANAGE} || ${JUDGE} || (${OWN_ENTRY}) || (${PUBLIC_ENTRY})`,
        ),
    (app) =>
        setEntryReadRule(
            app,
            `${MANAGE} || (${OWN_ENTRY}) || (${PUBLIC_ENTRY})`,
        ),
)
