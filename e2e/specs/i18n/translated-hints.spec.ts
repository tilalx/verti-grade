import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

const TEXT: Record<
    string,
    { resetHint: string; newPassword: string; health: string }
> = {
    'de-DE': {
        resetHint: 'Gib die E-Mail-Adresse deines Kontos ein.',
        newPassword: 'Wähle ein neues Passwort für dein Konto.',
        health: 'Server online',
    },
    'ru-RU': {
        resetHint: 'Введите адрес электронной почты вашего аккаунта.',
        newPassword: 'Придумайте новый пароль для аккаунта.',
        health: 'Сервер доступен',
    },
    'tr-TR': {
        resetHint: 'Hesabınızın e-posta adresini girin.',
        newPassword: 'Hesabınız için yeni bir şifre belirleyin.',
        health: 'Sunucu çalışıyor',
    },
    'uk-UA': {
        resetHint: 'Введіть електронну адресу свого акаунта.',
        newPassword: 'Придумайте новий пароль для акаунта.',
        health: 'Сервер доступний',
    },
}

test('reset request asks for the account email', async ({ page }, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, '/auth/login')
    await page.getByTestId('login-goto-reset').click()
    await expect(page.getByTestId('reset-form')).toBeVisible()
    await expect(page.getByTestId('auth-subtitle')).toHaveText(text.resetHint)
})

test('reset link page asks for a new password', async ({ page }, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, '/auth/confirm-password-reset/looks-like-a-token')
    await expect(page.getByTestId('auth-subtitle')).toHaveText(text.newPassword)
})

test('footer shows the server status in the active locale', async ({
    page,
}, testInfo) => {
    const text = TEXT[testInfo.project.use.locale as string]!
    await gotoSettled(page, '/')
    await expect(page.getByTestId('footer-health')).toHaveText(text.health)
})
