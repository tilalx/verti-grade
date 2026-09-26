import PocketBase from 'pocketbase'
import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { authAsSuperuser, uiaa } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

async function superuserPb() {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    return pb
}

function stat(page: Page, key: string) {
    return page
        .getByTestId(`analytics-stat-${key}`)
        .getByTestId('stats-card-value')
}

async function statValue(page: Page, key: string) {
    return Number((await stat(page, key).textContent())?.trim())
}

function trend(page: Page, key: string) {
    return page
        .getByTestId(`analytics-stat-${key}`)
        .getByTestId('stats-card-trend')
}

async function gotoSubscribed(page: Page, path: string, topic: string) {
    const subscribed = page.waitForResponse(
        (response) =>
            response.url().includes('/api/realtime') &&
            response.request().method() === 'POST' &&
            !!response.request().postData()?.includes(topic),
    )
    await gotoSettled(page, path)
    await subscribed
}

test('renders kpis with trends, sparklines, meters and charts', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics')

    for (const key of [
        'activeRoutes',
        'routesSet',
        'ratings',
        'averageRating',
        'comments',
        'averageLifespan',
    ]) {
        await expect(stat(page, key)).not.toBeEmpty()
    }
    await expect(trend(page, 'routesSet')).toBeVisible()
    await expect(
        page
            .getByTestId('analytics-stat-routesSet')
            .getByTestId('stats-card-spark'),
    ).toBeVisible()
    await expect(
        page
            .getByTestId('analytics-stat-activeRoutes')
            .getByTestId('stats-card-meter'),
    ).toBeVisible()

    for (const chart of [
        'analytics-chart-grades',
        'analytics-chart-activity',
        'analytics-chart-location-grades',
        'analytics-chart-age',
    ]) {
        const box = await page.getByTestId(chart).boundingBox()
        expect(box?.width, chart).toBeGreaterThan(0)
        expect(box?.height, chart).toBeGreaterThan(0)
    }
})

test('analytics api rejects users without the view_analytics permission', async ({
    userPage: page,
    request,
}) => {
    await gotoSettled(page, '/')
    const forbidden = await page.request.get('/api/manage/analytics', {
        headers: await authHeader(page),
    })
    expect(forbidden.status()).toBe(403)

    const anonymous = await request.get('/api/manage/analytics')
    expect(anonymous.status()).toBe(401)
})

test('filters live in the url and survive a reload', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics?range=all')
    const allRoutes = await statValue(page, 'activeRoutes')
    await expect(trend(page, 'routesSet')).toHaveCount(0)

    await page.getByTestId('analytics-range-30d').click()
    await expect(page).toHaveURL(/range=30d/)
    await expect(trend(page, 'routesSet')).toBeVisible()

    await gotoSettled(page, page.url())
    await expect(page.getByTestId('analytics-range-30d')).toHaveClass(
        /text-primary/,
    )

    await gotoSettled(page, '/manage/analytics?range=all&type=Boulder')
    await expect(page.getByTestId('analytics-filter-type')).toContainText(
        'Boulder',
    )
    expect(await statValue(page, 'activeRoutes')).toBeLessThan(allRoutes)
})

test('archived chip matches the routes page and toggles the url', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics?range=all')
    const chip = page.getByTestId('analytics-filter-archived')
    await expect(chip.locator('.mdi-archive-outline')).toBeVisible()

    await chip.click()
    await expect(page).toHaveURL(/archived=true/)
    await expect(chip).toHaveClass(/text-warning/)

    await chip.click()
    await expect(page).not.toHaveURL(/archived=true/)
})

test('filters share one row with the ranges on wide screens', async ({
    adminPage: page,
}) => {
    const rowOf = async (testId: string) => {
        const box = await page.getByTestId(testId).boundingBox()
        return Math.round(box!.y + box!.height / 2)
    }

    await page.setViewportSize({ width: 1920, height: 900 })
    await gotoSettled(page, '/manage/analytics?range=all')
    expect(await rowOf('analytics-filter-location')).toBe(
        await rowOf('analytics-range-all'),
    )

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect
        .poll(() => rowOf('analytics-filter-location'))
        .toBeGreaterThan(await rowOf('analytics-range-all'))
})

test('custom range writes the dates into the url', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics')
    await page.getByTestId('analytics-range-custom').click()
    await page
        .getByTestId('analytics-filter-from')
        .locator('input')
        .fill('2020-01-01')
    await expect(page).toHaveURL(/range=custom/)
    await expect(page).toHaveURL(/from=2020-01-01/)
})

test('updates live when a route is created elsewhere', async ({
    adminPage: page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    await gotoSubscribed(page, '/manage/analytics?range=30d', 'routes/*')
    const routesBefore = await statValue(page, 'routesSet')

    const setter = `${testPrefix}-live-setter`
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-live-route`,
        ...uiaa('5'),
        type: 'Route',
        creator: [setter],
        screw_date: new Date().toISOString(),
    })
    try {
        await expect
            .poll(() => statValue(page, 'routesSet'), { timeout: 15_000 })
            .toBeGreaterThan(routesBefore)
        const response = await page.request.get(
            '/api/manage/analytics?range=30d',
            { headers: await authHeader(page) },
        )
        const { setters } = await response.json()
        expect(
            setters.map((entry: { setter: string }) => entry.setter),
        ).toContain(setter)
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('heatmap switches years and shows day counts', async ({
    adminPage: page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-heatmap-route`,
        ...uiaa('5'),
        type: 'Route',
        creator: [`${testPrefix}-heatmap-setter`],
        screw_date: '2011-06-15 12:00:00.000Z',
    })
    try {
        await gotoSettled(page, '/manage/analytics?range=all')
        const heatmap = page.getByTestId('analytics-heatmap')
        const rollingDays = await heatmap.locator('[data-date]').count()
        expect(rollingDays).toBeGreaterThanOrEqual(365)
        expect(rollingDays).toBeLessThanOrEqual(366)

        await heatmap.getByTestId('analytics-heatmap-year-2011').click()
        await expect(
            heatmap.getByTestId('analytics-heatmap-total'),
        ).toContainText('2011')

        const cell = heatmap.locator('[data-date="2011-06-15"]')
        await expect(cell).toHaveAttribute('data-count', /[1-9]/)
        await expect(cell).not.toHaveClass(/heatmap-level-0/)
        await expect(heatmap.locator('[data-date]')).toHaveCount(365)

        await cell.hover()
        await expect(page.locator('.heatmap-tooltip')).toBeVisible()
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('reports routes whose grade votes are harder than the set grade', async ({
    adminPage: page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-sandbag`,
        ...uiaa('1'),
        type: 'Route',
        creator: ['Sandbagger'],
        screw_date: new Date().toISOString(),
    })
    try {
        for (let vote = 0; vote < 3; vote++) {
            await pb.collection('ratings').create({
                route_id: route.id,
                rating: 4,
                ...uiaa('10'),
            })
        }
        await gotoSettled(page, '/manage/analytics?range=all')
        await expect(
            page.getByTestId('analytics-chart-grade-feedback'),
        ).toBeVisible()

        const response = await page.request.get(
            '/api/manage/analytics?range=all',
            { headers: await authHeader(page) },
        )
        const { gradeFeedback } = await response.json()
        const sandbag = gradeFeedback.find(
            (entry: { id: string }) => entry.id === route.id,
        )
        expect(sandbag).toMatchObject({ setGrade: 1.5, grade: '1' })
        expect(sandbag.deviation).toBeGreaterThan(8)
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('archiving a route stamps archived_at and restoring clears it', async ({
    testPrefix,
}) => {
    const pb = await superuserPb()
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-archive`,
        ...uiaa('4'),
        type: 'Boulder',
        creator: [`${testPrefix}-archive-setter`],
    })
    try {
        expect(route.archived_at).toBe('')

        const archived = await pb
            .collection('routes')
            .update(route.id, { archived: true })
        expect(archived.archived_at).not.toBe('')

        const edited = await pb
            .collection('routes')
            .update(route.id, { name: `${testPrefix}-archive-renamed` })
        expect(edited.archived_at).toBe(archived.archived_at)

        const restored = await pb
            .collection('routes')
            .update(route.id, { archived: false })
        expect(restored.archived_at).toBe('')
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('archived routes are left out like on the routes page unless included', async ({
    adminPage: page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    const setter = `${testPrefix}-archived-setter`
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-archived-analytics`,
        ...uiaa('5'),
        type: 'Boulder',
        creator: [setter],
        archived: true,
    })
    try {
        await gotoSettled(page, '/manage/analytics')
        const settersFor = async (query: string) => {
            const response = await page.request.get(
                `/api/manage/analytics?range=all${query}`,
                { headers: await authHeader(page) },
            )
            const body = (await response.json()) as {
                setters: { setter: string }[]
            }
            return body.setters.map((entry) => entry.setter)
        }

        expect(await settersFor('')).not.toContain(setter)
        expect(await settersFor('&archived=true')).toContain(setter)
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('has no horizontal scroll on phones', async ({ adminPage: page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoSettled(page, '/manage/analytics')
    await expect(page.getByTestId('analytics-filters')).toBeVisible()
    const overflow = await page.evaluate(
        () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
})

test('shows an error notification when the analytics fetch fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/analytics')
    await page.route('**/api/manage/analytics*', (route) =>
        route.fulfill({ status: 500, body: 'boom' }),
    )
    await page.getByTestId('analytics-range-30d').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()
})
