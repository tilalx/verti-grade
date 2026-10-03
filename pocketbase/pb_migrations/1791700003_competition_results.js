/// <reference path="../pb_data/types.d.ts" />
const MANAGE = '@request.auth.role.permissions.name ?= "manage_competitions"'
const JUDGE = '@request.auth.role.permissions.name ?= "judge_competitions"'
const OWN_SCORE_READ = 'entry.user = @request.auth.id'
const PUBLISHED = 'competition.status = "published"'
const LIVE = 'competition.status != "draft" && competition.live_ranking = true'
const NOT_FROZEN =
    '(competition.freeze_at = "" || competition.freeze_at > @now)'

const SCORES_READ_BEFORE = `${MANAGE} || ${OWN_SCORE_READ} || ${PUBLISHED} || (${LIVE})`
const SCORES_READ = `${MANAGE} || ${JUDGE} || ${OWN_SCORE_READ} || ${PUBLISHED} || (${LIVE} && ${NOT_FROZEN})`

migrate(
    (app) => {
        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        competitions.fields.addAt(
            competitions.fields.length,
            new Field({
                id: 'date_competitions_freeze_at',
                name: 'freeze_at',
                type: 'date',
            }),
        )
        app.save(competitions)
        app.db()
            .newQuery(
                "UPDATE competitions SET freeze_at = strftime('%Y-%m-%d %H:%M:%fZ', ends_at, '-' || freeze_minutes || ' minutes') WHERE live_ranking = TRUE AND freeze_minutes > 0",
            )
            .execute()

        const scores = app.findCollectionByNameOrId('competition_scores_col_id')
        scores.listRule = SCORES_READ
        scores.viewRule = SCORES_READ
        app.save(scores)

        const standings = new Collection({
            id: 'competition_standings_col_id',
            name: 'competition_standings',
            type: 'view',
            listRule: 'competition.status != "draft"',
            viewRule: 'competition.status != "draft"',
            viewQuery:
                "SELECT id, competition, category, bib, (CASE WHEN hidden THEN '' ELSE display_name END) AS display_name FROM competition_entries WHERE status IN ('registered', 'checked_in')",
        })
        app.save(standings)
    },
    (app) => {
        app.delete(app.findCollectionByNameOrId('competition_standings_col_id'))

        const scores = app.findCollectionByNameOrId('competition_scores_col_id')
        scores.listRule = SCORES_READ_BEFORE
        scores.viewRule = SCORES_READ_BEFORE
        app.save(scores)

        const competitions = app.findCollectionByNameOrId('competitions_col_id')
        competitions.fields.removeById('date_competitions_freeze_at')
        app.save(competitions)
    },
)
