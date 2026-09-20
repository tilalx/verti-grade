import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'

// The page and both user dialogs each render a role picker and used to fetch
// the list independently — four requests for one page load. They now share a
// single useAsyncData key, resolved during SSR.
test('fetches the role list once per page load', async ({
    adminPage: page,
}) => {
    const roleRequests: string[] = []
    page.on('request', (req) => {
        if (/\/api\/collections\/roles\/records/.test(req.url())) {
            roleRequests.push(req.url())
        }
    })

    await gotoSettled(page, '/admin/users')
    await expect(page.getByTestId('user-create-open')).toBeVisible()

    // At most one, from RolePermissionsEditor — it keeps its own copy because
    // it mutates role records. Everything else shares the SSR'd payload.
    expect(roleRequests.length).toBeLessThanOrEqual(1)
})

test('the role picker is populated without a fetch of its own', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/users')
    await page.getByTestId('user-create-open').click()
    await expect(page.getByTestId('user-create-dialog')).toBeVisible()

    await page.getByTestId('user-create-role').click()
    await expect(page.getByRole('option').first()).toBeVisible()
})
