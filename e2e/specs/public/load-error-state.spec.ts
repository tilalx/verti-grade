import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('the overview offers a retry when its routes fail to load', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('overview-all-routes').click()
    await page.waitForURL(/\/routes/)

    await page.route('**/api/collections/averageRating/records*', (route) =>
        route.abort('failed'),
    )
    await page.goBack()
    await page.waitForURL((url) => url.pathname === '/')

    const loadError = page.getByTestId('load-error')
    await expect(loadError).toBeVisible()
    await expect(loadError).toHaveAttribute('role', 'alert')

    await page.unroute('**/api/collections/averageRating/records*')
    await page.getByTestId('load-error-retry').click()
    await expect(loadError).toBeHidden()
})
