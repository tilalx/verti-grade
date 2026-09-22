import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('opens the mobile nav drawer and navigates', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('nav-hamburger').click()
    await expect(page.getByTestId('nav-drawer')).toBeVisible()
    await page.getByTestId('nav-drawer-link-manage-comments').click()
    await page.waitForURL('**/manage/comments')
})

test('the desktop nav is hidden on mobile and the hamburger is reachable', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    await expect(page.getByTestId('nav-desktop-links')).toBeHidden()

    const hamburger = page.getByTestId('nav-hamburger')
    await expect(hamburger).toBeVisible()

    const box = (await hamburger.boundingBox())!
    const viewport = page.viewportSize()!
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
})

test('the mobile filter button is big enough to show its icon', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    const filterButton = page.getByTestId('filter-open-sheet')
    await expect(filterButton).toBeVisible()

    const box = (await filterButton.boundingBox())!
    expect(box.height).toBeGreaterThanOrEqual(28)
    expect(box.width).toBeGreaterThanOrEqual(28)
})
