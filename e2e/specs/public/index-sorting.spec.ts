import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('sorting the desktop table by name header actually reorders rows', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    const names = () => page.locator('.route-name').allTextContents()

    const beforeAsc = await names()
    await page.getByRole('columnheader', { name: /name/i }).click()
    // Sort refetches server-side — poll instead of racing the request.
    await expect.poll(names).not.toEqual(beforeAsc)
    const afterAsc = await names()
    expect(afterAsc).toEqual([...afterAsc].sort((a, b) => a.localeCompare(b)))

    // Descending page 1 is the alphabetically last rows, not ascending
    // page 1 reversed — assert order, not row identity.
    await page.getByRole('columnheader', { name: /name/i }).click()
    await expect.poll(names).not.toEqual(afterAsc)
    const afterDesc = await names()
    expect(afterDesc).toEqual([...afterDesc].sort((a, b) => b.localeCompare(a)))
})
