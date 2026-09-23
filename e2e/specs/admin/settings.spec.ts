import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test.describe.configure({ mode: 'serial' })

test('updates organization settings', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/settings')

    const value = `E2E Org ${Date.now()}`
    await page.getByTestId('settings-org-name').locator('input').fill(value)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings')
    await expect(
        page.getByTestId('settings-org-name').locator('input'),
    ).toHaveValue(value)
})

test('shows an error and keeps the form open when save fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    const orgName = page.getByTestId('settings-org-name').locator('input')
    const original = `E2E Baseline ${Date.now()}`
    await orgName.fill(original)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await page.route('**/api/collections/settings/records/**', (route) =>
        route.abort('failed'),
    )

    await page
        .getByTestId('settings-org-name')
        .locator('input')
        .fill(`E2E Fail ${Date.now()}`)
    await page.getByTestId('settings-save').click()

    await expect(page.getByTestId('global-snackbar')).toBeVisible()
    await expect(page.getByTestId('settings-save')).toBeVisible()

    await page.unroute('**/api/collections/settings/records/**')
    await gotoSettled(page, '/admin/settings')
    await expect(
        page.getByTestId('settings-org-name').locator('input'),
    ).toHaveValue(original)
})

test('legal fields feed the built-in imprint page', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    const address = `E2E Street ${Date.now()}\n63450 Hanau`
    await page.getByTestId('settings-imprint-url').locator('input').fill('')
    await page.getByTestId('settings-privacy-url').locator('input').fill('')
    await page
        .getByTestId('settings-legal-address')
        .locator('textarea')
        .first()
        .fill(address)
    await page.getByTestId('settings-legal-add-representative').click()
    const representative = page
        .getByTestId('settings-legal-representative')
        .last()
    await representative
        .getByTestId('settings-legal-representative-name')
        .locator('input')
        .fill('E2E Representative')
    await representative
        .getByTestId('settings-legal-representative-role')
        .locator('input')
        .fill('Chair')
    await page
        .getByTestId('settings-legal-vat-id')
        .locator('input')
        .fill('DE123456789')
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    const response = await page.goto('/imprint')
    const html = (await response?.text()) ?? ''
    expect(html).toContain('E2E Representative')
    expect(html).toContain('DE123456789')
    await expect(page.getByTestId('imprint-address')).toContainText(
        address.split('\n')[0],
    )
    await expect(page.getByTestId('imprint-incomplete')).toHaveCount(0)

    await expect(page.getByTestId('footer-imprint')).toHaveAttribute(
        'href',
        '/imprint',
    )
    await expect(page.getByTestId('footer-privacy')).toHaveAttribute(
        'href',
        '/privacy',
    )
})

test('external legal URLs override the built-in pages', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    const imprintUrl = 'https://example.com/imprint'
    await page
        .getByTestId('settings-imprint-url')
        .locator('input')
        .fill(imprintUrl)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/')
    await expect(page.getByTestId('footer-imprint')).toHaveAttribute(
        'href',
        imprintUrl,
    )
    await expect(page.getByTestId('footer-privacy')).toHaveAttribute(
        'href',
        '/privacy',
    )

    await gotoSettled(page, '/admin/settings')
    await page.getByTestId('settings-imprint-url').locator('input').fill('')
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()
})

test('removing a representative marks the form dirty and saves', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    const rows = page.getByTestId('settings-legal-representative')
    const before = await rows.count()
    expect(before).toBeGreaterThan(0)

    await page
        .getByTestId('settings-legal-remove-representative')
        .first()
        .click()
    await expect(rows).toHaveCount(before - 1)
    await expect(page.getByTestId('settings-save')).toBeVisible()
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings')
    await expect(rows).toHaveCount(before - 1)
})
