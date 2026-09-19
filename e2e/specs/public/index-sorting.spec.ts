import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('sorting the desktop table by name header actually reorders rows', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    const names = () => page.locator('.route-name').allTextContents()

    const beforeAsc = await names()
    await page.getByRole('columnheader', { name: /name/i }).click()
    await expect(page.getByTestId('index-table')).toBeVisible()
    const afterAsc = await names()
    expect(afterAsc).not.toEqual(beforeAsc)
    expect(afterAsc).toEqual([...afterAsc].sort((a, b) => a.localeCompare(b)))

    // Click again to flip to descending — order should invert too.
    await page.getByRole('columnheader', { name: /name/i }).click()
    const afterDesc = await names()
    expect(afterDesc).toEqual([...afterAsc].reverse())
})
