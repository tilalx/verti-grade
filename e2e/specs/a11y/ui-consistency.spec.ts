import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

// The shared layout primitives (LayoutPageHeader, LayoutDialogShell,
// LayoutEmptyState) only pay off if every screen actually routes through
// them. These assertions are what "unified" means in practice.

const PAGES = [
    '/',
    '/admin/routes',
    '/admin/users',
    '/admin/comments',
    '/admin/analytics',
    '/admin/settings',
    '/admin/inventory',
]

for (const path of PAGES) {
    test(`${path} renders exactly one top-level heading`, async ({
        adminPage: page,
    }) => {
        await gotoSettled(page, path)
        // Dialogs are closed on load, so every h1 in the DOM is page chrome.
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator('h1')).not.toBeEmpty()
    })
}

test('every icon-only button exposes an accessible name', async ({
    adminPage: page,
}) => {
    for (const path of ['/admin/routes', '/admin/users', '/admin/comments']) {
        await gotoSettled(page, path)
        const unnamed = await page
            .locator('button.v-btn--icon:visible')
            .evaluateAll((buttons) =>
                buttons
                    .filter(
                        (b) =>
                            !b.getAttribute('aria-label')?.trim() &&
                            !b.textContent?.trim(),
                    )
                    .map((b) => b.outerHTML.slice(0, 120)),
            )
        expect(unnamed, `unnamed icon buttons on ${path}`).toEqual([])
    }
})

test('dialogs share the same shell: role, title and escape-to-close', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/routes')

    await page.getByTestId('routes-create-open').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // DialogShell always renders the title row through v-card-title.
    await expect(dialog.locator('.v-card-title')).not.toBeEmpty()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await expect(page.getByTestId('user-create-cancel')).toBeVisible()
})

test('an empty result set renders the shared empty state', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page
        .getByTestId('filter-search')
        .locator('input')
        .fill('zzz-no-such-user-zzz')
    await expect(page.getByTestId('empty-state')).toBeVisible()
})
