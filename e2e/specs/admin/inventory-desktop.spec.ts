import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

// Shown once per device and it swallows the first click, so every inventory
// spec marks it seen — before the page's own script runs, not after.
test.beforeEach(async ({ adminPage: page }) => {
    await page.addInitScript(() =>
        localStorage.setItem('inventory-instructions-seen', '1'),
    )
})

test('shows controls beside both checklists, without tabs', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/inventory')

    // Desktop has room for both lists, so the tab switcher is not rendered.
    await expect(page.getByTestId('inventory-tab-missing')).toHaveCount(0)
    await expect(page.getByTestId('inventory-missing-count')).toBeVisible()
    await expect(page.getByTestId('inventory-found-count')).toBeVisible()

    // Scanner in the middle: the list a scan empties on its left, the list a
    // scan fills on its right.
    const missing = (await page
        .getByTestId('inventory-column-missing')
        .boundingBox())!
    const controls = (await page
        .getByTestId('inventory-controls')
        .boundingBox())!
    const found = (await page
        .getByTestId('inventory-column-found')
        .boundingBox())!

    expect(controls.x).toBeGreaterThanOrEqual(missing.x + missing.width)
    expect(found.x).toBeGreaterThanOrEqual(controls.x + controls.width)
})

test('runs an inventory without a camera: pick a site, mark a route found', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/inventory')

    await page.getByTestId('inventory-location-Hanau').click()

    const firstMissing = page
        .locator('[data-testid^="inventory-mark-"]')
        .first()
    await expect(firstMissing).toBeVisible()
    const routeId = (await firstMissing.getAttribute('data-testid'))!.replace(
        'inventory-mark-',
        '',
    )

    await firstMissing.click()

    // Moves across to the found column, undo-able from there.
    await expect(page.getByTestId(`inventory-scanned-${routeId}`)).toBeVisible()
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toHaveCount(
        0,
    )
    await expect(page.getByTestId('inventory-progress')).toContainText('1/')

    // Vuetify runs closeLabel through its own locale adapter, so passing a
    // translated string here made it look up a key named "Change location".
    await expect(
        page.getByTestId('inventory-change-location').getByLabel(/./),
    ).toHaveAttribute('aria-label', 'Change location')

    await page.getByTestId(`inventory-undo-${routeId}`).click()
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toBeVisible()
})

test('manual add dialog opens from the missing column', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/inventory')
    await page.getByTestId('inventory-location-Hanau').click()

    await page.getByTestId('inventory-manual-open').click()
    await expect(page.getByTestId('inventory-manual-dialog')).toBeVisible()
})
