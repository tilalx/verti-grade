import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS, locationId } from '../../support/seed'

async function openScopedInventory(page: Page) {
    await gotoSettled(page, '/manage/inventory')
    const hallA = await locationId(page, LOCATIONS[0])
    await page.evaluate((location) => {
        localStorage.setItem('inventory-instructions-seen', '1')
        localStorage.setItem(
            'inventory-scanned-route-ids',
            JSON.stringify({ v: 3, location, ids: [] }),
        )
    }, hallA)
    await page.reload()
    await page
        .locator('[data-testid="inventory-progress"]')
        .waitFor({ state: 'visible' })
}

async function firstMissingRouteId(page: Page) {
    const res = await page.request.get(
        '/api/collections/routes/records?' +
            new URLSearchParams({
                filter: `name ~ "e2e-route-" && archived = false && location.name = "${LOCATIONS[0]}"`,
                perPage: '1',
                sort: 'anchor_point,name',
            }),
    )
    return (await res.json()).items[0].id as string
}

test('marks a route found from the still-to-find list and undoes it', async ({
    adminPage: page,
}) => {
    await openScopedInventory(page)
    const routeId = await firstMissingRouteId(page)

    await expect(page.getByTestId('inventory-found-count')).toHaveText('0')
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toBeVisible()

    await page.getByTestId(`inventory-mark-${routeId}`).click()

    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toHaveCount(
        0,
    )

    await page.getByTestId('inventory-tab-found').click()
    await page.getByTestId(`inventory-undo-${routeId}`).click()

    await expect(page.getByTestId('inventory-found-count')).toHaveText('0')
    await page.getByTestId('inventory-tab-missing').click()
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toBeVisible()
})

test('marks a route found through the manual search dialog', async ({
    adminPage: page,
}) => {
    await openScopedInventory(page)
    const routeId = await firstMissingRouteId(page)
    const routeName = await page
        .getByTestId(`inventory-missing-${routeId}`)
        .locator('.v-list-item-title')
        .innerText()

    await page.getByTestId('inventory-manual-open').click()
    const dialog = page.getByTestId('inventory-manual-dialog')
    await expect(dialog).toBeVisible()

    await page
        .getByTestId('inventory-manual-search')
        .locator('input')
        .fill(routeName)
    await page.getByTestId(`inventory-manual-item-${routeId}`).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')
})

test('reset clears progress only after confirmation', async ({
    adminPage: page,
}) => {
    await openScopedInventory(page)
    const routeId = await firstMissingRouteId(page)
    await page.getByTestId(`inventory-mark-${routeId}`).click()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')

    await page.getByTestId('inventory-reset').click()
    await expect(page.getByTestId('confirm-dialog')).toBeVisible()
    await page.getByTestId('confirm-dialog-cancel').click()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')

    await page.getByTestId('inventory-reset').click()
    await page.getByTestId('confirm-dialog-confirm').click()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('0')
})

test('reserves no camera space until scanning starts', async ({
    adminPage: page,
}) => {
    await openScopedInventory(page)

    await expect(page.locator('.scanner-viewport')).toHaveCount(0)

    const tabs = await page.getByTestId('inventory-tab-missing').boundingBox()
    expect(tabs!.y).toBeLessThan(300)
})

test('restores found routes after a reload', async ({ adminPage: page }) => {
    await openScopedInventory(page)
    const routeId = await firstMissingRouteId(page)

    await page.getByTestId(`inventory-mark-${routeId}`).click()
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')

    await page.reload()
    await page
        .locator('[data-testid="inventory-progress"]')
        .waitFor({ state: 'visible' })
    await expect(page.getByTestId('inventory-found-count')).toHaveText('1')
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toHaveCount(
        0,
    )
})
