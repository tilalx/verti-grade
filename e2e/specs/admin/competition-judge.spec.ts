import { test, expect } from '../../support/fixtures'
import { stat } from 'node:fs/promises'
import { gotoSettled } from '../../support/nav'

test('a judge records lead heights, staff export results and tops reach the logbook', async ({
    setterPage,
    root,
    workerLocation,
    createRoute,
    createUser,
    testPrefix,
}) => {
    const hour = 60 * 60 * 1000
    const competition = await root.collection('competitions').create({
        name: `${testPrefix} Lead Cup`,
        location: workerLocation.id,
        status: 'open',
        discipline: 'rope',
        scoring_format: 'lead_height',
        starts_at: new Date(Date.now() - hour).toISOString(),
        ends_at: new Date(Date.now() + hour).toISOString(),
        live_ranking: true,
    })
    const category = await root
        .collection('competition_categories')
        .create({ competition: competition.id, name: 'Youth' })
    const rope = await createRoute({ name: `${testPrefix} Lead 1` })
    await root.collection('competition_routes').create({
        competition: competition.id,
        route: rope.id,
        number: 1,
        hold_count: 30,
    })
    const climber = await createUser('user', 'leader')
    const entry = await root.collection('competition_entries').create({
        competition: competition.id,
        user: climber.id,
        category: category.id,
        display_name: `${testPrefix} Leader`,
        birth_year: 1995,
    })
    const savedScore = async () => {
        const scores = await root.collection('competition_scores').getFullList({
            filter: root.filter('entry = {:entry}', { entry: entry.id }),
        })
        return scores[0]
            ? [scores[0].height, scores[0].height_plus, scores[0].top_attempt]
            : null
    }

    await gotoSettled(
        setterPage,
        `/manage/competitions/${competition.id}/judge`,
        /\/judge$/,
    )
    await expect(setterPage.getByTestId('judge-route-name')).toContainText(
        rope.name,
    )
    await expect(setterPage.getByTestId('judge-route-details')).toBeVisible()
    const row = setterPage.getByTestId(`judge-entry-${entry.bib}`)
    await row.getByTestId(`judge-height-${entry.bib}`).fill('22')
    await row.getByTestId(`judge-height-${entry.bib}`).blur()
    await expect.poll(savedScore).toEqual([22, false, 0])
    await row.getByTestId(`judge-plus-${entry.bib}`).click()
    await expect.poll(savedScore).toEqual([22, true, 0])
    await row.getByTestId(`judge-top-${entry.bib}`).click()
    await expect.poll(savedScore).toEqual([30, false, 1])

    await gotoSettled(
        setterPage,
        `/manage/competitions/${competition.id}`,
        /\/manage\/competition/,
    )
    for (const [kind, format] of [
        ['results', 'pdf'],
        ['startlist', 'xlsx'],
        ['certificates', 'pdf'],
    ] as const) {
        await setterPage.getByTestId('competition-export').click()
        await setterPage
            .getByTestId(`competition-export-${kind}-${format}`)
            .click()
        if (kind === 'certificates') {
            await setterPage.getByTestId('export-locale').click()
            await setterPage.getByRole('option', { name: 'Deutsch' }).click()
        }
        const download = setterPage.waitForEvent('download')
        await setterPage.getByTestId('export-confirm').click()
        const file = await download
        expect(file.suggestedFilename()).toMatch(
            kind === 'certificates'
                ? /Urkunden\.pdf$/
                : new RegExp(`\\.${format}$`),
        )
        const { size } = await stat((await file.path())!)
        expect(size).toBeGreaterThan(1000)
    }

    await root
        .collection('competitions')
        .update(competition.id, { status: 'published' })
    await expect
        .poll(async () => {
            const ticks = await root.collection('ticks').getFullList({
                filter: root.filter('user = {:user} && route = {:route}', {
                    user: climber.id,
                    route: rope.id,
                }),
            })
            return ticks.map((tick) => [tick.type, tick.note])
        })
        .toEqual([['flash', `${testPrefix} Lead Cup`]])

    await gotoSettled(
        setterPage,
        `/manage/competitions/${competition.id}`,
        /\/manage\/competition/,
    )
    await setterPage.getByTestId('competition-more').click()
    await setterPage.getByTestId('competition-delete').click()
    await setterPage.getByTestId('confirm-dialog-confirm').click()
    await expect(setterPage).toHaveURL(/\/manage\/competitions$/)
    await expect
        .poll(async () =>
            root
                .collection('competition_entries')
                .getFullList({
                    filter: root.filter('competition = {:id}', {
                        id: competition.id,
                    }),
                })
                .then((entries) => entries.length),
        )
        .toBe(0)
})
