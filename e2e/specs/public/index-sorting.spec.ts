import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('sorting the desktop table by name header actually reorders rows', async ({
    page,
}) => {
    await gotoSettled(page, '/')
    const names = () => page.locator('.route-name').allTextContents()

    const beforeAsc = await names()
    await page.getByRole('columnheader', { name: /name/i }).click()
    // Sorting refetches server-side — wait for the row order to actually
    // change instead of racing the request.
    await expect.poll(names).not.toEqual(beforeAsc)
    const afterAsc = await names()
    expect(afterAsc).toEqual([...afterAsc].sort((a, b) => a.localeCompare(b)))

    // Click again to flip to descending. Sorting and pagination are both
    // server-side, so descending page 1 holds the alphabetically *last* rows —
    // not the reverse of ascending page 1. Assert the order, not the rows.
    await page.getByRole('columnheader', { name: /name/i }).click()
    await expect.poll(names).not.toEqual(afterAsc)
    const afterDesc = await names()
    expect(afterDesc).toEqual([...afterDesc].sort((a, b) => b.localeCompare(a)))
})
