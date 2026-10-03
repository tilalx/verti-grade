import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('live results rank climbers, hide names on request and freeze before the end', async ({
    page,
    setterPage,
    root,
    workerLocation,
    createRoute,
    createUser,
    testPrefix,
}) => {
    const hour = 60 * 60 * 1000
    const competition = await root.collection('competitions').create({
        name: `${testPrefix} Results Jam`,
        location: workerLocation.id,
        status: 'open',
        discipline: 'boulder',
        scoring_format: 'dynamic',
        starts_at: new Date(Date.now() - hour).toISOString(),
        ends_at: new Date(Date.now() + hour).toISOString(),
        live_ranking: true,
        freeze_minutes: 0,
    })
    const category = await root
        .collection('competition_categories')
        .create({ competition: competition.id, name: 'Open' })
    const compRoutes = []
    for (const number of [1, 2]) {
        const boulder = await createRoute({
            type: 'Boulder',
            name: `${testPrefix} Results ${number}`,
        })
        compRoutes.push(
            await root.collection('competition_routes').create({
                competition: competition.id,
                route: boulder.id,
                number,
                zone: true,
            }),
        )
    }
    const enter = async (label: string, hidden: boolean) => {
        const user = await createUser('user', label)
        return root.collection('competition_entries').create({
            competition: competition.id,
            user: user.id,
            category: category.id,
            display_name: `${testPrefix} ${label}`,
            birth_year: 1990,
            hidden,
        })
    }
    const anna = await enter('anna', false)
    const ben = await enter('ben', true)
    const top = (entry: string, compRoute: string) =>
        root.collection('competition_scores').create({
            entry,
            comp_route: compRoute,
            attempts: 1,
            top_attempt: 1,
        })
    await top(anna.id, compRoutes[0]!.id)
    await top(anna.id, compRoutes[1]!.id)
    await top(ben.id, compRoutes[0]!.id)

    await gotoSettled(page, `/competitions/${competition.id}`, /\/competition/)
    const standings = page.getByTestId('competition-standings')
    await expect(standings.getByTestId(`standing-rank-${anna.bib}`)).toHaveText(
        '1',
    )
    await expect(
        standings.getByTestId(`standing-points-${anna.bib}`),
    ).toHaveText('1,500')
    await expect(standings.getByTestId(`standing-${ben.bib}`)).toContainText(
        'Hidden climber',
    )
    await expect(
        standings.getByTestId(`standing-${ben.bib}`),
    ).not.toContainText(`${testPrefix} ben`)

    await page.goto(`/competitions/${competition.id}/tv`)
    await expect(
        page.getByTestId('competition-tv').getByTestId(`standing-${anna.bib}`),
    ).toContainText(`${testPrefix} anna`)

    await root
        .collection('competitions')
        .update(competition.id, { freeze_minutes: 120 })
    await expect
        .poll(
            async () => {
                await page.goto(`/competitions/${competition.id}`)
                return page
                    .getByTestId('competition-standings-frozen')
                    .isVisible()
            },
            { timeout: 20_000, intervals: [2_000] },
        )
        .toBe(true)

    await gotoSettled(
        setterPage,
        `/manage/competitions/${competition.id}`,
        /\/manage\/competition/,
    )
    await setterPage.getByRole('tab', { name: 'Results' }).click()
    await expect(setterPage.getByTestId(`standing-${ben.bib}`)).toContainText(
        `${testPrefix} ben`,
    )
})
