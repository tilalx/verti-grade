import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
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
                location: 'Gelnhausen',
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

    await gotoSettled(page, '/admin/routes')
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('routes-import-open').click()
    const chooser = await fileChooserPromise
    await chooser.setFiles(file)

    await expect(page.getByTestId('import-route-dialog')).toBeVisible()
    await page.getByTestId('import-route-confirm').click()
    await expect(page.getByTestId('global-snackbar')).toBeVisible()

    await page.getByTestId('filter-search').locator('input').fill(name)
    await expect(page.getByTestId('routes-table')).toContainText(name)

    fs.unlinkSync(file)
})
