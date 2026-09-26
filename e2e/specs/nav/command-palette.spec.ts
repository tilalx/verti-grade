import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('opens with the keyboard shortcut and jumps to a route', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.keyboard.press('ControlOrMeta+k')

    const input = page.getByTestId('command-palette-input').locator('input')
    await expect(input).toBeFocused()
    await input.fill('e2e-route-1')

    const results = page.getByTestId('command-palette-result')
    await expect(results.first()).toContainText('e2e-route-1')
    await input.press('Enter')
    await page.waitForURL(/\/route\?id=/)
})

test('lists permitted pages for signed-in users', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('command-palette-open').click()
    const input = page.getByTestId('command-palette-input').locator('input')
    await expect(input).toBeFocused()
    await input.fill('Users')
    await page.getByTestId('command-palette-result').first().click()
    await page.waitForURL('**/admin/users')
})

test('shows an empty state when nothing matches', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('command-palette-open').click()
    await page
        .getByTestId('command-palette-input')
        .locator('input')
        .fill('no-such-thing-e2e-xyz')
    await expect(page.getByTestId('command-palette-empty')).toBeVisible()
})

test('finds routes by setter and shows grade and setter', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.getByTestId('command-palette-open').click()
    await page
        .getByTestId('command-palette-input')
        .locator('input')
        .fill('Setter 2')
    await expect(page.getByTestId('command-palette-group-routes')).toBeVisible()
    await expect(
        page.getByTestId('command-palette-result').first(),
    ).toContainText('Setter 2')
})

test('moves the selection with the arrow keys', async ({ page }) => {
    await gotoSettled(page, '/')
    await page.keyboard.press('ControlOrMeta+k')
    const input = page.getByTestId('command-palette-input').locator('input')
    await input.fill('e2e-route-1')
    const results = page.getByTestId('command-palette-result')
    await expect(results.nth(1)).toBeVisible()
    await input.press('ArrowDown')
    await expect(results.nth(1)).toHaveClass(/v-list-item--active/)
})

async function paletteSearch(
    page: import('@playwright/test').Page,
    text: string,
) {
    await gotoSettled(page, '/')
    await page.getByTestId('command-palette-open').click()
    await page.getByTestId('command-palette-input').locator('input').fill(text)
}

test.describe('admin search across the app', () => {
    test('finds users and opens them on the users page', async ({
        adminPage: page,
    }) => {
        await paletteSearch(page, 'e2e-user@verti-grade.test')
        const group = page.getByTestId('command-palette-group-users')
        await expect(group).toBeVisible()
        await page
            .getByTestId('command-palette-result')
            .filter({ hasText: 'e2e-user@verti-grade.test' })
            .first()
            .click()
        await page.waitForURL(/\/admin\/users\?search=/)
        await expect(
            page.getByTestId('filter-search').locator('input'),
        ).toHaveValue('e2e-user@verti-grade.test')
    })

    test('finds roles', async ({ adminPage: page }) => {
        await paletteSearch(page, 'routesetter')
        await expect(
            page.getByTestId('command-palette-group-roles'),
        ).toBeVisible()
    })

    test('finds review content', async ({ adminPage: page }) => {
        await paletteSearch(page, 'e2e-rating-')
        await expect(
            page.getByTestId('command-palette-group-reviews'),
        ).toBeVisible()
    })

    test('jumps to a settings section', async ({ adminPage: page }) => {
        await paletteSearch(page, 'Privacy URL')
        await expect(
            page.getByTestId('command-palette-group-settings'),
        ).toBeVisible()
        await page
            .getByTestId('command-palette-result')
            .filter({ hasText: 'Privacy URL' })
            .click()
        await page.waitForURL(/\/admin\/settings#settings-urls/)
    })
})

test('never queries admin data without permission', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/')
    const forbidden: string[] = []
    page.on('request', (request) => {
        if (
            /\/api\/collections\/(users|roles|ratings|reports)\/records/.test(
                request.url(),
            )
        )
            forbidden.push(request.url())
    })
    await page.getByTestId('command-palette-open').click()
    await page.getByTestId('command-palette-input').locator('input').fill('e2e')
    await expect(page.getByTestId('command-palette-group-routes')).toBeVisible()
    for (const group of ['users', 'roles', 'reviews', 'reports', 'settings'])
        await expect(
            page.getByTestId(`command-palette-group-${group}`),
        ).toHaveCount(0)
    expect(forbidden).toEqual([])
})
