import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

test('the profile avatar upload opens with the keyboard', async ({
    userPage: page,
}) => {
    await gotoSettled(page, '/')
    await page.getByTestId('user-menu-activator').click()
    await page.getByTestId('user-menu-profile').click()

    const upload = page.getByTestId('profile-avatar-upload')
    await expect(upload).toHaveAttribute('role', 'button')
    await expect(upload).toHaveAttribute('aria-label', /.+/)

    await upload.focus()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Enter')
    await chooser
})

test('the admin avatar uploads are keyboard buttons', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()

    const upload = page.getByTestId('user-create-avatar-upload')
    await expect(upload).toHaveAttribute('role', 'button')
    await upload.focus()
    const chooser = page.waitForEvent('filechooser')
    await page.keyboard.press('Space')
    await chooser
})
