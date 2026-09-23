import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS } from '../../support/seed'

test.beforeEach(async ({ adminPage: page }) => {
    await page.addInitScript(() =>
        localStorage.setItem('inventory-instructions-seen', '1'),
    )
})

test('shows controls beside both checklists, without tabs', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/inventory')

    await expect(page.getByTestId('inventory-tab-missing')).toHaveCount(0)
    await expect(page.getByTestId('inventory-missing-count')).toBeVisible()
    await expect(page.getByTestId('inventory-found-count')).toBeVisible()

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

    await page.getByTestId(`inventory-location-${LOCATIONS[0]}`).click()

    const firstMissing = page
        .locator('[data-testid^="inventory-mark-"]')
        .first()
    await expect(firstMissing).toBeVisible()
    const routeId = (await firstMissing.getAttribute('data-testid'))!.replace(
        'inventory-mark-',
        '',
    )

    await firstMissing.click()

    await expect(page.getByTestId(`inventory-scanned-${routeId}`)).toBeVisible()
    await expect(page.getByTestId(`inventory-missing-${routeId}`)).toHaveCount(
        0,
    )
    await expect(page.getByTestId('inventory-progress')).toContainText('1/')
    await expect(page.getByTestId('inventory-change-location')).toContainText(
        LOCATIONS[0],
    )

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
    await page.getByTestId(`inventory-location-${LOCATIONS[0]}`).click()

    await page.getByTestId('inventory-manual-open').click()
    await expect(page.getByTestId('inventory-manual-dialog')).toBeVisible()
})
