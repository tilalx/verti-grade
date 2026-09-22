import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'

test('row checkboxes and select-all reflect the selected route ids', async ({
    adminPage: page,
}) => {
    const prefix = `e2e-select-${Date.now()}`

    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)

    for (let i = 0; i < 2; i++) {
        await page.request.post('/api/collections/routes/records', {
            headers,
            data: {
                name: `${prefix}-${i}`,
                difficulty: 5,
                anchor_point: 5,
                location: 'Hanau',
                type: 'Route',
                creator: ['E2E'],
                screw_date: '2026-01-01',
                archived: false,
            },
        })
    }

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.getByTestId('filter-search').locator('input').fill(prefix)
    await expect(page.getByTestId('routes-table')).toContainText(`${prefix}-0`)

    const boxes = page.getByTestId('routes-row-checkbox').locator('input')
    await expect(boxes).toHaveCount(2)
    await expect(boxes.first()).not.toBeChecked()

    await boxes.first().click()
    await expect(boxes.first()).toBeChecked()
    await expect(boxes.nth(1)).not.toBeChecked()
    await expect(page.getByTestId('routes-archive-selected')).toBeVisible()

    await page.getByTestId('routes-select-all').click()
    await expect(boxes.first()).toBeChecked()
    await expect(boxes.nth(1)).toBeChecked()

    await page.getByTestId('routes-select-all').click()
    await expect(boxes.first()).not.toBeChecked()
    await expect(boxes.nth(1)).not.toBeChecked()
    await expect(page.getByTestId('routes-archive-selected')).toHaveCount(0)
})
