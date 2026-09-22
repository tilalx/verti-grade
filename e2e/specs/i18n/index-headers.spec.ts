import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const DIFFICULTY: Record<string, string> = {
    'en-US': 'Difficulty',
    'de-DE': 'Schwierigkeitsgrad',
    'ru-RU': 'Сложность',
    'tr-TR': 'Zorluk',
    'uk-UA': 'Складність',
}

// The desktop headers are a computed, not a const evaluated once at setup, so
// they follow the active locale instead of whichever one setup happened to see.
test('public route table headers render in the active locale', async ({
    page,
}, testInfo) => {
    const locale = testInfo.project.use.locale as string
    await gotoSettled(page, '/')

    const table = page.getByTestId('index-table')
    await expect(table).toBeVisible()
    await expect(table.locator('th')).toContainText([DIFFICULTY[locale]!])
})
