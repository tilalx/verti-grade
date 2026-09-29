import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('saving settings only sends the fields that were edited', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/admin/settings')
    const current = await (
        await page.request.get(
            '/api/collections/settings/records/settings_123456',
        )
    ).json()

    let sentFields: string[] = []
    await page.route(
        '**/api/collections/settings/records/**',
        async (route) => {
            if (route.request().method() !== 'PATCH') return route.fallback()
            const body = route.request().postDataJSON()
            sentFields = Object.keys(body)
            await route.fulfill({ json: { ...current, ...body } })
        },
    )

    await page
        .getByTestId('settings-org-name')
        .locator('input')
        .fill(`${testPrefix}-org`)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    expect(sentFields).toEqual(['organization_name'])
})

test('an out of range audit retention cannot be saved', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')
    const retention = page.getByTestId('settings-audit-retention')

    await retention.locator('input').fill('0')
    await expect(retention).toContainText('whole number from 1 to 3650')
    await expect(page.getByTestId('settings-save')).toBeDisabled()

    await retention.locator('input').fill('3649')
    await expect(page.getByTestId('settings-save')).toBeEnabled()
})
