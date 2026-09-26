import { Workbook } from '@cj-tech-master/excelts'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { LOCATIONS, locationId } from '../../support/seed'

test('duplicate email on user creation shows a readable message', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()
    await page.getByTestId('user-create-firstname').locator('input').fill('E2E')
    await page
        .getByTestId('user-create-lastname')
        .locator('input')
        .fill('Duplicate')
    await page
        .getByTestId('user-create-email')
        .locator('input')
        .fill('e2e-admin@verti-grade.test')
    await page.getByTestId('user-create-submit').click()

    await expect(page.getByTestId('global-snackbar')).toContainText(
        'A user with this email already exists.',
    )
})

test('settings image labels and the logo alt text come from i18n', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')
    await expect(page.getByTestId('settings-asset-label-logo')).toHaveText(
        'App logo',
    )
    await expect(page.getByTestId('settings-asset-label-icon')).toHaveText(
        'Browser icon',
    )
    await expect(page.getByTestId('settings-asset-label-sign')).toHaveText(
        'Logo on route labels',
    )

    const logoAlt = await page
        .getByTestId('nav-logo')
        .locator('img')
        .first()
        .getAttribute('alt')
    expect(logoAlt).toBeTruthy()
    expect(logoAlt).not.toBe('Logo')
})

test('xlsx worksheet is named from the sent label without invalid characters', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const created = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name: `${testPrefix}-sheet`,
            difficulty: 5,
            location: await locationId(page, LOCATIONS[0]),
            type: 'Route',
            creator: ['E2E'],
        },
    })
    const routeId = (await created.json()).id as string

    const response = await page.request.post('/api/ui/xlsx', {
        headers,
        data: {
            ids: [routeId],
            columns: ['name'],
            labels: {
                sheet: 'Kletter/routen: [Halle] Nord mit sehr langem Namen',
            },
        },
    })
    expect(response.ok()).toBe(true)

    const workbook = new Workbook()
    await workbook.xlsx.load(await response.body())
    expect(workbook.worksheets[0]!.name).toBe('Kletterrouten Halle Nord mit se')

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
})
