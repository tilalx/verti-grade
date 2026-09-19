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
        await page.getByTestId('routes-export-xlsx').click()
        const downloadPromise = page.waitForEvent('download')
        await page.getByTestId('export-confirm').click()
        const download = await downloadPromise
        const filePath = await download.path()
        expect(filePath).toBeTruthy()
        const fs = await import('node:fs')
        const bytes = fs.readFileSync(filePath!)
        expect(bytes.subarray(0, 4)).toEqual(
            Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        )
    })

    test('exports selected routes as JSON with real route content', async ({
        adminPage: page,
    }) => {
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
        expect(parsed.length).toBeGreaterThan(0)

        // Content, not just shape: every exported record must carry real
        // route data (not an empty stub) and the seeded routes must actually
        // be present — catches regressions where the export handler resolves
        // IDs but drops fields or returns blanks.
        for (const route of parsed) {
            expect(route.id).toBeTruthy()
            expect(route.name).toBeTruthy()
            expect(Array.isArray(route.ratings)).toBe(true)
        }
        expect(
            parsed.some((r: { name: string }) => r.name.includes('e2e-route-')),
        ).toBe(true)
    })

    test('exports only the selected columns, with QR images', async ({
        adminPage: page,
    }) => {
        await gotoSettled(page, '/admin/routes')
        await page.getByTestId('routes-select-all').click()
        await page.getByTestId('routes-export-xlsx').click()

        // Two clicks always end on "nothing selected", whatever the stored
        // selection was: the first selects all, the second clears it.
        await page.getByTestId('export-toggle-all').click()
        await page.getByTestId('export-toggle-all').click()
        // data-testid lands on the VCheckbox wrapper, so tick the input itself.
        await page.getByTestId('export-column-name').locator('input').check()
        await page.getByTestId('export-column-qr').locator('input').check()
        // Reordering must not break the export: push the QR column to the front.
        await page.getByTestId('export-move-up-qr').click()

        const downloadPromise = page.waitForEvent('download')
        await page.getByTestId('export-confirm').click()
        const download = await downloadPromise
        const filePath = await download.path()
        expect(filePath).toBeTruthy()

        const fs = await import('node:fs')
        const bytes = fs.readFileSync(filePath!)
        expect(bytes.subarray(0, 4)).toEqual(
            Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        )
        // Zip entry names sit in the local file headers as plain text, so the
        // embedded QR PNGs are visible without unzipping.
        expect(bytes.includes(Buffer.from('xl/media/image1.png'))).toBe(true)
    })
})
