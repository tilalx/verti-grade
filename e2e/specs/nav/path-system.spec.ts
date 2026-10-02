import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const TOP_LEVEL = [
    'nav-link-home',
    'nav-link-map',
    'nav-link-routes',
    'nav-link-logbook',
    'nav-link-manage-routes',
]
const GROUPS = ['nav-group-manage', 'nav-group-admin']

test('the desktop sidebar lists every page in labelled sections', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    const sidebar = page.getByTestId('nav-desktop-links')
    await expect(sidebar).toBeVisible()
    for (const id of [...TOP_LEVEL, ...GROUPS, 'nav-link-admin-settings']) {
        await expect(sidebar.getByTestId(id)).toBeVisible()
    }

    const sidebarBox = (await sidebar.boundingBox())!
    const mainBox = (await page.locator('#main-content').boundingBox())!
    expect(sidebarBox.x + sidebarBox.width).toBeLessThanOrEqual(mainBox.x)
})

test('collapsing the sidebar keeps the icons and survives a reload', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    const sidebar = page.getByTestId('nav-sidebar')
    const widthOf = async () =>
        (await sidebar.locator('[data-slot="container"]').boundingBox())!.width

    const expanded = await widthOf()
    await page.getByTestId('nav-sidebar-toggle').click()
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed')
    await expect.poll(widthOf).toBeLessThan(expanded / 2)

    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)
    await expect(sidebar).toHaveAttribute('data-state', 'collapsed')

    await page.getByTestId('nav-sidebar-toggle').click()
    await expect(sidebar).toHaveAttribute('data-state', 'expanded')
})

test('section links navigate to their pages', async ({ adminPage: page }) => {
    await gotoSettled(page, '/manage/routes', /\/manage\/routes/)

    await page.getByTestId('nav-link-manage-comments').click()
    await page.waitForURL('**/manage/comments')

    await page.getByTestId('nav-link-admin-settings').click()
    await page.waitForURL('**/admin/settings')
})

test('the section label shows as active while one of its pages is open', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/inventory', /\/manage\/inventory/)

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

    await expect(page.getByTestId('nav-group-admin')).toHaveCount(0)
    await expect(page.getByTestId('nav-link-manage-routes')).toBeVisible()
})

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
