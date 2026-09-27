import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('staff reach their pages from the account tab, not a drawer', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('nav-hamburger')).toHaveCount(0)
    await expect(page.getByTestId('nav-desktop-links')).toBeHidden()

    await page.getByTestId('bottom-nav-account').click()
    await page.waitForURL('**/account')
    await expect(page.getByTestId('me-section-manage')).toBeVisible()
    await expect(page.getByTestId('me-section-admin')).toBeVisible()
    await page.getByTestId('me-staff-manage-comments').click()
    await page.waitForURL('**/manage/comments')
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
