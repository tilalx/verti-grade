import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const PAGES = [
    '/',
    '/manage/routes',
    '/admin/users',
    '/manage/comments',
    '/manage/analytics',
    '/admin/settings',
    '/manage/inventory',
    '/manage/reports',
    '/account/activity',
]

for (const path of PAGES) {
    test(`${path} renders exactly one top-level heading`, async ({
        adminPage: page,
    }) => {
        await gotoSettled(page, path)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator('h1')).not.toBeEmpty()
    })
}

test('every icon-only button exposes an accessible name', async ({
    adminPage: page,
}) => {
    for (const path of [
        '/manage/routes',
        '/admin/users',
        '/manage/comments',
        '/manage/reports',
        '/account/activity',
    ]) {
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
    await gotoSettled(page, '/manage/routes')

    await page.getByTestId('routes-create-open').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.v-card-title')).not.toBeEmpty()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()
    await expect(page.getByTestId('user-create-cancel')).toBeVisible()
})

test('an empty result set renders the shared empty state as a real card', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page
        .getByTestId('filter-search')
        .locator('input')
        .fill('zzz-no-such-user-zzz')
    const empty = page.getByTestId('empty-state')
    await expect(empty).toBeVisible()

    const box = await empty.evaluate((el) => {
        const cs = getComputedStyle(el)
        const icon = el.querySelector('.v-icon')!.getBoundingClientRect()
        const self = el.getBoundingClientRect()
        return {
            display: cs.display,
            radius: parseFloat(cs.borderTopLeftRadius),
            border: parseFloat(cs.borderTopWidth),
            iconOffset: Math.abs(
                (icon.left + icon.right) / 2 - (self.left + self.right) / 2,
            ),
        }
    })
    expect(box.display).toBe('block')
    expect(box.radius).toBeGreaterThan(0)
    expect(box.border).toBeGreaterThan(0)
    expect(box.iconOffset).toBeLessThan(2) // icon is centred
})

test('dialog confirm buttons keep their fill inside v-card-actions', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('routes-create-open').click()

    const submit = page.getByTestId('route-form-submit')
    await expect(submit).toHaveClass(/v-btn--variant-flat/)
    await expect(page.getByTestId('route-form-cancel')).toHaveClass(
        /v-btn--variant-text/,
    )
})
