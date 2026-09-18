import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('sorting the desktop table by name header does not error', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    await page.getByRole('columnheader', { name: /name/i }).click()
    await expect(page.getByTestId('index-table')).toBeVisible()
})
