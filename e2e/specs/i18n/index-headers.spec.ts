import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { projectLanguage, translate } from '../../support/i18n'

const HEADER_KEYS = [
    'climbing.difficulty',
    'climbing.anchor_point',
    'climbing.creators',
    'routes.screwed_at',
]

test('public route table headers use the climbing terms of the active locale', async ({
    page,
}, testInfo) => {
    const language = projectLanguage(testInfo)
    await gotoSettled(page, '/routes')

    const table = page.getByTestId('index-table')
    await expect(table).toBeVisible()
    await expect(table.locator('th')).toContainText(
        HEADER_KEYS.map((key) => translate(language, key)),
    )
})
