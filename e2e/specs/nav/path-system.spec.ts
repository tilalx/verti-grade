import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

/**
 * Paths are grouped by audience, and the nav mirrors that grouping:
 *   /manage/*  day-to-day gym work, one permission each
 *   /admin/*   users and settings
 *   /account/* your own, no permission
 *
 * The point of the grouping is that the desktop link row stays a fixed
 * width as pages get added — it used to grow until it pushed the user menu
 * off the right edge.
 */

const TOP_LEVEL = ['nav-link-home', 'nav-link-manage-routes']
const GROUPS = ['nav-group-manage', 'nav-group-admin']

test('the desktop link row is the four grouped items, not one per page', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    const row = page.getByTestId('nav-desktop-links')
    await expect(row).toBeVisible()

    for (const id of [...TOP_LEVEL, ...GROUPS]) {
        await expect(row.getByTestId(id)).toBeVisible()
    }
    // An admin can reach all eight pages, but only these four are in the row.
    await expect(row.locator('button')).toHaveCount(
        TOP_LEVEL.length + GROUPS.length,
    )

    // The whole row fits left of the user menu.
    const rowBox = (await row.boundingBox())!
    const menuBox = (await page
        .getByTestId('user-menu-activator')
        .boundingBox())!
    expect(rowBox.x + rowBox.width).toBeLessThanOrEqual(menuBox.x)
})

test('a group menu opens and navigates to its pages', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    await page.getByTestId('nav-group-manage').click()
    await page.getByTestId('nav-link-manage-comments').click()
    await page.waitForURL('**/manage/comments')

    await page.getByTestId('nav-group-admin').click()
    await page.getByTestId('nav-link-admin-settings').click()
    await page.waitForURL('**/admin/settings')
})

test('the group button shows as active while one of its pages is open', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/comments', /\/manage\/comments/)

    await expect(page.getByTestId('nav-group-manage')).toHaveClass(
        /nav-link--active/,
    )
    await expect(page.getByTestId('nav-group-admin')).not.toHaveClass(
        /nav-link--active/,
    )
})

test('a group with no permitted page is left out entirely', async ({
    setterPage: page,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    // A route setter manages no users and no settings, so the Admin group
    // would otherwise render as a button opening an empty menu.
    await expect(page.getByTestId('nav-group-admin')).toHaveCount(0)
    await expect(page.getByTestId('nav-link-manage-routes')).toBeVisible()
})

// The old flat paths went out on staff bookmarks, so they still have to land.
const MOVED = [
    ['/admin/routes', '/manage/routes'],
    ['/admin/comments', '/manage/comments'],
    ['/admin/reports', '/manage/reports'],
    ['/admin/analytics', '/manage/analytics'],
    ['/admin/inventory', '/manage/inventory'],
    ['/admin/activity', '/account/activity'],
]

for (const [from, to] of MOVED) {
    test(`${from} redirects to ${to}`, async ({ adminPage: page }) => {
        const response = await page.goto(from)
        expect(response?.status()).toBe(200)
        expect(new URL(page.url()).pathname).toBe(to)
    })
}

test('the pages that stayed under /admin are still there', async ({
    adminPage: page,
}) => {
    for (const path of ['/admin/users', '/admin/settings']) {
        await gotoSettled(page, path, new RegExp(path))
        await expect(page.locator('h1')).toHaveCount(1)
    }
})
