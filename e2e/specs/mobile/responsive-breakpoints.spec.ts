import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('switches to the desktop layout at the lg breakpoint', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1023, height: 900 })
    await gotoSettled(page, '/routes')
    await expect(page.getByTestId('bottom-nav')).toBeVisible()
    await expect(page.getByTestId('index-table')).toHaveCount(0)

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(page.getByTestId('bottom-nav')).toBeHidden()
    await expect(page.getByTestId('index-table')).toBeVisible()
})

test('shows the grade conversion label from the sm breakpoint', async ({
    page,
}) => {
    await page.setViewportSize({ width: 639, height: 900 })
    await gotoSettled(page, '/routes')
    const open = page.getByTestId('index-grade-conversion-open')
    await expect(open.getByText('Grade conversion')).toBeHidden()

    await page.setViewportSize({ width: 640, height: 900 })
    await expect(open.getByText('Grade conversion')).toBeVisible()
})
