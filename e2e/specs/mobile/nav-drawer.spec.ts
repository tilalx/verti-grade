import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('opens the mobile nav drawer and navigates', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')
    await page.getByTestId('nav-hamburger').click()
    await expect(page.getByTestId('nav-drawer')).toBeVisible()
    await page.getByTestId('nav-drawer-link-admin-comments').click()
    await page.waitForURL('**/admin/comments')
})

// Regression: scoped `.nav-links { display: flex }` is unlayered, so it beat
// Vuetify 4's layered `.d-none` and forced the desktop nav onto mobile, which
// overflowed the bar and pushed the hamburger off-screen. Clicking the
// hamburger still "worked" in Playwright, so only a visibility assertion
// catches it.
test('the desktop nav is hidden on mobile and the hamburger is reachable', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')

    await expect(page.getByTestId('nav-desktop-links')).toBeHidden()

    const hamburger = page.getByTestId('nav-hamburger')
    await expect(hamburger).toBeVisible()

    // Inside the viewport, not pushed past its right edge.
    const box = (await hamburger.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
})

// Regression: density="compact" on a size="small" v-btn subtracts 12px in
// Vuetify 4, shrinking the button until it clips its own icon.
test('the mobile filter button is big enough to show its icon', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')

    const filterButton = page.getByTestId('filter-open-sheet')
    await expect(filterButton).toBeVisible()

    const box = (await filterButton.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(28)
    expect(box.width).toBeGreaterThanOrEqual(28)
})
