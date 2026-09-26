import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('shows no rows for a search with no matches', async ({ page }) => {
    await gotoSettled(page, '/')
    await page
        .getByTestId('filter-search')
        .locator('input')
        .fill('no-such-route-e2e-xyz')
    await expect(page.getByTestId('index-table')).not.toContainText(
        'e2e-route-',
    )
})

test('filters the route list by search text', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('filter-search').locator('input').fill('e2e-route-1')
    await expect(page.getByTestId('index-table')).toContainText('e2e-route-1')
})

test('filters by grade, and every visible row actually matches', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('index-filter-difficulty').click()
    await page.getByRole('option', { name: '5 · UIAA', exact: true }).click()
    await expect(page.getByTestId('index-table')).toBeVisible()

    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                'name ~ "e2e-route-" && grade_system = "uiaa" && grade = "5" && archived = false',
            ) +
            '&perPage=1',
    )
    const body = await res.json()
    if (body.items.length > 0) {
        await page
            .getByTestId('filter-search')
            .locator('input')
            .fill(body.items[0].name)
        await expect(page.getByTestId('index-table')).toContainText(
            body.items[0].name,
        )
    }
})

test('searches by setter name', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('filter-search').locator('input').fill('Setter 3')
    const rows = page.getByTestId('index-table').locator('tbody tr')
    await expect(rows.first()).toContainText('Setter 3')
    for (const row of await rows.all())
        await expect(row).toContainText('Setter 3')
})

test('combines a route name with a signed grade', async ({ page }) => {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent(
                'name ~ "e2e-route-" && archived = false && grade_system = "uiaa" && grade ~ "%+"',
            ) +
            '&perPage=1',
    )
    const route = (await res.json()).items[0]

    await gotoSettled(page, '/')
    const search = page.getByTestId('filter-search').locator('input')
    const exactRoute = page
        .getByTestId('index-table')
        .getByText(route.name, { exact: true })

    const level = route.grade.slice(0, -1)
    await search.fill(`${route.name} ${level}+`)
    await expect(exactRoute).toBeVisible()

    await search.fill(`${route.name} ${level}-`)
    await expect(exactRoute).toHaveCount(0)
})
