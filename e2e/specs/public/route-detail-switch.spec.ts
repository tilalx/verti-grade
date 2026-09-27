import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

async function seededRoutes(page: Page, count: number) {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            `&perPage=${count}&sort=name`,
    )
    return (await res.json()).items as { id: string; name: string }[]
}

async function ratedRouteId(page: Page) {
    const res = await page.request.get(
        '/api/collections/ratings/records?perPage=1&filter=' +
            encodeURIComponent('rating > 0'),
    )
    return (await res.json()).items[0].route_id as string
}

test('switching to another route via the command palette shows that route', async ({
    page,
}) => {
    const [first, second] = await seededRoutes(page, 2)
    await gotoSettled(page, `/route?id=${first!.id}`)
    await expect(page.getByTestId('route-page-name')).toHaveText(first!.name)

    await page.getByTestId('command-palette-open').click()
    const input = page.getByTestId('command-palette-input').locator('input')
    await input.fill(second!.name)
    await expect(
        page.getByTestId('command-palette-result').first(),
    ).toContainText(second!.name)
    await input.press('Enter')

    await page.waitForURL(new RegExp(`id=${second!.id}`))
    await expect(page.getByTestId('route-page-name')).toHaveText(second!.name)
})

test.describe('russian locale', () => {
    test.use({ locale: 'ru-RU' })

    test('shows the translated route type', async ({ page }) => {
        const [route] = await seededRoutes(page, 1)
        await gotoSettled(page, `/route?id=${route!.id}`)
        await expect(page.getByTestId('route-type-chip')).toHaveText(
            /^(Маршрут|Боулдер)$/,
        )
    })
})

test.describe('german locale', () => {
    test.use({ locale: 'de-DE' })

    test('formats the average rating with a decimal comma', async ({
        page,
    }) => {
        const routeId = await ratedRouteId(page)
        await gotoSettled(page, `/route?id=${routeId}`)
        await expect(page.getByTestId('route-avg-rating')).toContainText(
            /\d,\d/,
        )
    })
})
