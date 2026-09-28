import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.use({ viewport: { width: 1160, height: 900 } })

test('the route table fits without sideways scrolling', async ({ page }) => {
    await gotoSettled(page, '/routes')
    const container = page.getByTestId('index-table')
    const table = container.getByRole('table')
    await expect(table).toBeVisible()

    const containerWidth = (await container.boundingBox())!.width
    await expect
        .poll(async () => (await table.boundingBox())!.width)
        .toBeLessThanOrEqual(containerWidth + 1)
})

test('stacked setter chips keep clear of the row dividers', async ({
    page,
    createRoute,
}) => {
    const route = await createRoute({
        creator: ['E2E Setter With A Long Name', 'Second Long Setter Name'],
    })
    await gotoSettled(page, '/routes')
    await page.getByTestId('filter-search').locator('input').fill(route.name)

    const row = page
        .getByRole('row')
        .filter({ has: page.getByTestId(`index-row-${route.id}`) })
    const chips = row.getByTestId('index-row-creators')
    await expect(chips).toBeVisible()

    await expect(chips.getByText(/Setter/)).toHaveCount(2)

    const gaps = await row.evaluate((tr) => {
        const chipBoxes = [
            ...tr.querySelector('[data-testid="index-row-creators"]')!.children,
        ].map((chip) => chip.getBoundingClientRect())
        const rect = tr.getBoundingClientRect()
        return {
            top: chipBoxes[0]!.top - rect.top,
            bottom: rect.bottom - chipBoxes[chipBoxes.length - 1]!.bottom,
        }
    })
    expect(gaps.top).toBeGreaterThanOrEqual(4)
    expect(gaps.bottom).toBeGreaterThanOrEqual(4)
})
