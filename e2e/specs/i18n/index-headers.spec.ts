import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const HEADERS: Record<string, string[]> = {
    'en-US': ['Grade', 'Anchor', 'Setters', 'Set on'],
    'de-DE': ['Grad', 'Umlenker', 'Schrauber', 'Geschraubt am'],
    'ru-RU': ['Категория', 'Станция', 'Рутсеттеры', 'Дата накрутки'],
    'tr-TR': ['Derece', 'Ankraj', 'Rota kurucuları', 'Kurulum tarihi'],
    'uk-UA': ['Категорія', 'Станція', 'Рутсетери', 'Дата накрутки'],
}

test('public route table headers use the climbing terms of the active locale', async ({
    page,
}, testInfo) => {
    const locale = testInfo.project.use.locale as string
    await gotoSettled(page, '/')

    const table = page.getByTestId('index-table')
    await expect(table).toBeVisible()
    await expect(table.locator('th')).toContainText(HEADERS[locale]!)
})
