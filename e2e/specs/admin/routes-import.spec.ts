import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS } from '../../support/seed'
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
                difficulty: 6,
                difficulty_sign: '+',
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
                difficulty: 6,
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
