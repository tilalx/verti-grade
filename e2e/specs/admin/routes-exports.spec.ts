import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.describe('exports', () => {
    test('exports selected routes as PDF', async ({ adminPage: page }) => {
        await gotoSettled(page, '/admin/routes')
        await page.getByTestId('routes-select-all').click()
        const downloadPromise = page.waitForEvent('download')
        await page.getByTestId('routes-export-pdf').click()
        const download = await downloadPromise
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
        const fs = await import('node:fs')
        const bytes = fs.readFileSync(filePath!)
        expect(bytes.subarray(0, 4).toString()).toBe('%PDF')
    })

    test('exports selected routes as XLSX', async ({ adminPage: page }) => {
        await gotoSettled(page, '/admin/routes')
        await page.getByTestId('routes-select-all').click()
        const downloadPromise = page.waitForEvent('download')
        await page.getByTestId('routes-export-xlsx').click()
        const download = await downloadPromise
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
        const fs = await import('node:fs')
        const bytes = fs.readFileSync(filePath!)
        expect(bytes.subarray(0, 4)).toEqual(
            Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        )
    })

    test('exports selected routes as JSON', async ({ adminPage: page }) => {
        await gotoSettled(page, '/admin/routes')
        await page.getByTestId('routes-select-all').click()
        const downloadPromise = page.waitForEvent('download')
        await page.getByTestId('routes-export-json').click()
        const download = await downloadPromise
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
        const fs = await import('node:fs')
        const parsed = JSON.parse(fs.readFileSync(filePath!, 'utf8'))
        expect(Array.isArray(parsed)).toBe(true)
    })
})
