import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { PB_URL } from '../../support/map'
import { LOCATIONS, authAsSuperuser, uiaa } from '../../support/seed'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

test('imports routes from a JSON file', async ({ adminPage: page }) => {
    const name = `e2e-import-${Date.now()}`
    const file = path.join(os.tmpdir(), `${name}.json`)
    fs.writeFileSync(
        file,
        JSON.stringify([
            {
                name,
                difficulty: 8,
                difficulty_sign: null,
                anchor_point: 8,
                location: LOCATIONS[1].toUpperCase(),
                type: 'Boulder',
                comment: 'imported by e2e',
                creator: ['E2E Importer'],
                screw_date: '2026-01-01',
                color: '#2196F3',
                archived: false,
                ratings: [],
            },
        ]),
    )

    await gotoSettled(page, '/manage/routes')
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('routes-import-open').click()
    const chooser = await fileChooserPromise
    await chooser.setFiles(file)

    await expect(page.getByTestId('import-route-dialog')).toBeVisible()
    await page.getByTestId('import-route-confirm').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()

    await page.getByTestId('filter-search').locator('input').fill(name)
    await expect(page.getByTestId('routes-table')).toContainText(name)
    await expect(page.getByTestId('routes-table')).toContainText(LOCATIONS[1])
    await expect(page.getByTestId('routes-table')).toContainText('6B')

    fs.unlinkSync(file)
})

test('reports import issues when route creation fails server-side', async ({
    adminPage: page,
}) => {
    const name = `e2e-import-fail-${Date.now()}`
    const file = path.join(os.tmpdir(), `${name}.json`)
    fs.writeFileSync(
        file,
        JSON.stringify([
            {
                name,
                ...uiaa('6'),
                location: LOCATIONS[1],
                type: 'Boulder',
                creator: ['E2E Importer'],
                screw_date: '2026-01-01',
                ratings: [],
            },
        ]),
    )

    await gotoSettled(page, '/manage/routes')
    await page.route('**/api/collections/routes/records', (route) =>
        route.fulfill({ status: 500, body: 'boom' }),
    )

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('routes-import-open').click()
    const chooser = await fileChooserPromise
    await chooser.setFiles(file)

    await expect(page.getByTestId('import-route-dialog')).toBeVisible()
    await page.getByTestId('import-route-confirm').click()
    await expect(page.getByTestId('global-snackbar')).toContainText(/issues/i)

    fs.unlinkSync(file)
})

test('rejects a malformed JSON file', async ({ adminPage: page }) => {
    const file = path.join(os.tmpdir(), `e2e-import-bad-${Date.now()}.json`)
    fs.writeFileSync(file, '{ not valid json ]')

    await gotoSettled(page, '/manage/routes')
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('routes-import-open').click()
    const chooser = await fileChooserPromise
    await chooser.setFiles(file)

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('import-route-dialog')).toBeHidden()

    fs.unlinkSync(file)
})

test('imports more ratings than the per-user rating rate limit', async ({
    adminPage: page,
    testPrefix,
}) => {
    const name = `${testPrefix}-import-many`
    const ratingCount = 70
    const file = path.join(os.tmpdir(), `${name}.json`)
    fs.writeFileSync(
        file,
        JSON.stringify([
            {
                name,
                ...uiaa('6'),
                location: LOCATIONS[0],
                type: 'Route',
                creator: ['E2E Importer'],
                screw_date: '2026-01-01',
                ratings: Array.from({ length: ratingCount }, (_, index) => ({
                    rating: 1 + (index % 5),
                    ...uiaa('6'),
                    comment: `${name} rating ${index}`,
                })),
            },
        ]),
    )
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)

    try {
        await gotoSettled(page, '/manage/routes')
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByTestId('routes-import-open').click()
        const chooser = await fileChooserPromise
        await chooser.setFiles(file)
        const bulkImport = page.waitForResponse('**/api/import/ratings')
        await page.getByTestId('import-route-confirm').click()
        expect((await bulkImport).ok()).toBe(true)
        await expect(page.getByTestId('global-snackbar')).toBeVisible()
        await expect(page.getByTestId('global-snackbar')).not.toContainText(
            /issues/i,
        )

        const ratings = await root.collection('ratings').getList(1, 1, {
            filter: root.filter('route_id.name = {:name}', { name }),
        })
        expect(ratings.totalItems).toBe(ratingCount)
    } finally {
        fs.unlinkSync(file)
        const routes = await root.collection('routes').getFullList({
            filter: root.filter('name = {:name}', { name }),
        })
        for (const route of routes) {
            await root.collection('routes').delete(route.id)
        }
    }
})

test('only route managers may bulk import ratings', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/')
    const response = await page.request.post('/api/import/ratings', {
        headers: await authHeader(page),
        data: { ratings: [] },
    })
    expect(response.status()).toBe(403)
})
