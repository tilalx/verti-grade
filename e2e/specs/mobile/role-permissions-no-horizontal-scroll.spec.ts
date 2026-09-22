import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('the role permission editor never scrolls sideways on a small phone', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await gotoSettled(page, '/admin/users')

    const grid = page.getByTestId('role-permissions-table')
    await expect(grid).toBeVisible()

    const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)

    const box = (await grid.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(375)
})

test('every role card and its permission toggles stay reachable on a phone', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await gotoSettled(page, '/admin/users')

    const cards = page.locator('[data-testid^="role-permissions-row-"]')
    await expect(cards.first()).toBeVisible()
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
        const box = (await cards.nth(i).boundingBox())!
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(375)
    }

    const toggle = page.getByTestId('role-permissions-user-view_analytics')
    await toggle.scrollIntoViewIfNeeded()
    const toggleBox = (await toggle.boundingBox())!
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(375)
})

test('the role create dialog opens as a bottom sheet on a phone', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await gotoSettled(page, '/admin/users')

    await page.getByTestId('role-create-open').click()
    await expect(page.getByTestId('role-form-dialog')).toBeVisible()

    const sheet = page.locator('.v-overlay__content.dialog-shell--sheet')
    await expect(sheet).toBeVisible()
    const box = (await sheet.boundingBox())!
    expect(box.x).toBeLessThanOrEqual(1)
    expect(box.width).toBeGreaterThanOrEqual(374)

    const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)
})
