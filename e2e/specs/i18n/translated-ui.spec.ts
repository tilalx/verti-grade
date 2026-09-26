import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const TEXT: Record<
    string,
    { eyebrow: string; captcha: RegExp; wrongPassword: RegExp }
> = {
    'de-DE': {
        eyebrow: 'ROUTENVERWALTUNG',
        captcha: /Spam-Prüfung/,
        wrongPassword: /Aktuelles Passwort ist falsch/,
    },
    'ru-RU': {
        eyebrow: 'УПРАВЛЕНИЕ МАРШРУТАМИ',
        captcha: /Проверка на спам/,
        wrongPassword: /Текущий пароль неверен/,
    },
    'tr-TR': {
        eyebrow: 'ROTA YÖNETİMİ',
        captcha: /Spam kontrolü/,
        wrongPassword: /Mevcut şifre yanlış/,
    },
    'uk-UA': {
        eyebrow: 'УПРАВЛІННЯ МАРШРУТАМИ',
        captcha: /Перевірку на спам/,
        wrongPassword: /Поточний пароль/,
    },
}

test('login brand eyebrow is translated', async ({ page }, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, '/auth/login')
    await expect(page.getByTestId('auth-brand-eyebrow')).toHaveText(
        text.eyebrow,
    )
})

test('captcha failures show a translated message instead of the server text', async ({
    page,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await page.route('**/api/collections/users/auth-with-password', (route) =>
        route.fulfill({
            status: 400,
            contentType: 'application/json',
            json: {
                status: 400,
                message: 'Captcha verification failed.',
                data: {},
            },
        }),
    )

    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-identity').locator('input').fill('someone')
    await page.getByTestId('login-password').locator('input').fill('whatever1')
    await page.getByTestId('login-submit').click()

    const snackbar = page.getByTestId('global-snackbar')
    await expect(snackbar).toContainText(text.captcha)
    await expect(snackbar).not.toContainText('Captcha verification failed')
})

test('a wrong password on email change shows a translated message', async ({
    page,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await page.route('**/api/collections/users/confirm-email-change', (route) =>
        route.fulfill({
            status: 400,
            contentType: 'application/json',
            json: {
                status: 400,
                message: 'Failed to authenticate.',
                data: {
                    password: {
                        code: 'validation_invalid_password',
                        message: 'Missing or invalid auth record password.',
                    },
                },
            },
        }),
    )

    await gotoSettled(page, '/auth/confirm-email-change/looks-like-a-token')
    await page
        .getByTestId('email-change-password')
        .locator('input')
        .fill('E2ePassw0rd!')
    await page.getByTestId('email-change-submit').click()

    const snackbar = page.getByTestId('global-snackbar')
    await expect(snackbar).toContainText(text.wrongPassword)
    await expect(snackbar).not.toContainText('Failed to authenticate')
})
