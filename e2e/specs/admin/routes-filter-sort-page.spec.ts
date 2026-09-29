import { test, expect } from '../../support/fixtures'
import { gotoSettled, searchRoutes } from '../../support/nav'

test('combines filter, sort, and pagination on the admin routes table', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')

    await searchRoutes(page, 'e2e-route-')
    await expect(page.getByTestId('routes-table')).toBeVisible()

    await page.getByRole('columnheader', { name: /name/i }).click()
    const names = () => page.getByTestId('routes-row-name').allTextContents()
    const sorted = (list: string[]) =>
        [...list].sort((a, b) => a.localeCompare(b))

    let page1Asc: string[] = []
    await expect
        .poll(async () => {
            page1Asc = await names()
            return (
                page1Asc.length > 0 &&
                page1Asc.join() === sorted(page1Asc).join()
            )
        })
        .toBe(true)

    const nextPageButton = page.getByRole('button', { name: /next page/i })
    await expect(nextPageButton).toBeEnabled()
    await nextPageButton.click()

    let page2Asc: string[] = []
    await expect
        .poll(async () => {
            page2Asc = await names()
            return page2Asc.length > 0 && page2Asc.join() !== page1Asc.join()
        })
        .toBe(true)
    expect(page2Asc).toEqual(sorted(page2Asc))

    for (const name of page2Asc) {
        expect(name).toContain('e2e-route-')
    }
})
