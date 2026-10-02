import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { SETTINGS_ID } from '../../support/state-snapshot'

test('updates organization settings', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/settings?section=organization')

    const value = `E2E Org ${Date.now()}`
    await page.getByTestId('settings-org-name').fill(value)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings?section=organization')
    await expect(page.getByTestId('settings-org-name')).toHaveValue(value)
})

test('shows an error and keeps the form open when save fails', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings?section=organization')

    const orgName = page.getByTestId('settings-org-name')
    const original = `E2E Baseline ${Date.now()}`
    await orgName.fill(original)
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await page.route('**/api/collections/settings/records/**', (route) =>
        route.abort('failed'),
    )

    await page.getByTestId('settings-org-name').fill(`E2E Fail ${Date.now()}`)
    await page.getByTestId('settings-save').click()

    await expect(
        page.locator(
            '[data-testid="global-snackbar-message"][data-color="error"]',
        ),
    ).toBeVisible()
    await expect(page.getByTestId('settings-save')).toBeVisible()

    await page.unroute('**/api/collections/settings/records/**')
    await gotoSettled(page, '/admin/settings?section=organization')
    await expect(page.getByTestId('settings-org-name')).toHaveValue(original)
})

test('legal fields feed the built-in imprint page', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings?section=urls')
    await page.getByTestId('settings-imprint-url').fill('')
    await page.getByTestId('settings-privacy-url').fill('')
    if (await page.getByTestId('settings-save').isVisible()) {
        await page.getByTestId('settings-save').click()
        await expect(page.getByTestId('settings-save')).toBeHidden()
    }

    await gotoSettled(page, '/admin/settings?section=legal')
    const address = `E2E Street ${Date.now()}\n12345 City`
    await page.getByTestId('settings-legal-address').first().fill(address)
    await page.getByTestId('settings-legal-add-representative').click()
    const representative = page
        .getByTestId('settings-legal-representative')
        .last()
    await representative
        .getByTestId('settings-legal-representative-name')
        .fill('E2E Representative')
    await representative
        .getByTestId('settings-legal-representative-role')
        .fill('Chair')
    await page.getByTestId('settings-legal-vat-id').fill('DE123456789')
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
    await gotoSettled(page, '/admin/settings?section=urls')

    const imprintUrl = 'https://example.com/imprint'
    await page.getByTestId('settings-imprint-url').fill(imprintUrl)
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

    await gotoSettled(page, '/admin/settings?section=urls')
    await page.getByTestId('settings-imprint-url').fill('')
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()
})

test('removing a representative marks the form dirty and saves', async ({
    adminPage: page,
    root,
}) => {
    await root.collection('settings').update(SETTINGS_ID, {
        legal_representatives: [
            { name: 'E2E Keep', role: 'Chair' },
            { name: 'E2E Drop', role: 'Treasurer' },
        ],
    })
    await gotoSettled(page, '/admin/settings?section=legal')

    const rows = page.getByTestId('settings-legal-representative')
    await expect(rows).toHaveCount(2)

    await page
        .getByTestId('settings-legal-remove-representative')
        .last()
        .click()
    await expect(rows).toHaveCount(1)
    await expect(page.getByTestId('settings-save')).toBeVisible()
    await page.getByTestId('settings-save').click()
    await expect(page.getByTestId('settings-save')).toBeHidden()

    await gotoSettled(page, '/admin/settings?section=legal')
    await expect(rows).toHaveCount(1)
    await expect(
        rows.getByTestId('settings-legal-representative-name'),
    ).toHaveValue('E2E Keep')
})
