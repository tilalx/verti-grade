import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('the route manager never scrolls sideways on a small phone', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await gotoSettled(page, '/manage/routes')

    await expect(page.getByTestId('routes-mobile-pagination')).toBeVisible()

    const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)

    const pagination = (await page
        .getByTestId('routes-mobile-pagination')
        .boundingBox())!
    expect(pagination.x + pagination.width).toBeLessThanOrEqual(375)
})

test('the page strip keeps its ends in view on a small phone', async ({
    adminPage: page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await gotoSettled(page, '/manage/routes')
    await expect(page.getByTestId('routes-mobile-pagination')).toBeVisible()

    const lastPage = await page
        .locator('[data-testid^="routes-mobile-goto-"]')
        .last()
        .innerText()
    test.skip(
        Number(lastPage) < 4,
        'needs more than three pages of seeded routes',
    )

    await page.getByTestId('routes-mobile-next').click()
    await page.getByTestId('routes-mobile-next').click()

    await expect(page.getByTestId('routes-mobile-goto-1')).toBeVisible()
    await expect(
        page.getByTestId(`routes-mobile-goto-${lastPage}`),
    ).toBeVisible()
    await expect(page.locator('.route-manager__page-gap').first()).toBeVisible()

    const overflow = await page.evaluate(() => {
        const el = document.documentElement
        return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)
})
