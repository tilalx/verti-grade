import { test, expect } from '../../support/fixtures'
import { gotoSettled, authHeader } from '../../support/nav'

const ADMIN_PATHS = [
    '/admin/routes',
    '/admin/analytics',
    '/admin/comments',
    '/admin/users',
    '/admin/settings',
    '/admin/inventory',
]

test.describe('unauthenticated guard', () => {
    for (const path of ADMIN_PATHS) {
        test(`${path} redirects to login`, async ({ page }) => {
            await gotoSettled(page, path)
            await page.waitForURL('**/auth/login')
        })
    }
})

test.describe('routesetter guard', () => {
    // manage_users / manage_settings are admin-only permissions; the
    // routesetter role has manage_routes, view_analytics, manage_comments,
    // run_inventory but not those two.
    test('is redirected away from /admin/users', async ({
        setterPage: page,
    }) => {
        await gotoSettled(page, '/admin/users')
        await page.waitForURL((url) => !url.pathname.endsWith('/admin/users'))
    })

    test('is redirected away from /admin/settings', async ({
        setterPage: page,
    }) => {
        await gotoSettled(page, '/admin/settings')
        await page.waitForURL(
            (url) => !url.pathname.endsWith('/admin/settings'),
        )
    })

    test('the users API refuses a create from a routesetter session', async ({
        setterPage: page,
    }) => {
        // storageState's localStorage only applies once a page has loaded
        // the matching origin, so navigate before reading the auth token.
        await gotoSettled(page, '/admin/routes')
        const res = await page.request.post('/api/collections/users/records', {
            headers: await authHeader(page),
            data: {
                email: 'should-not-be-created@verti-grade.test',
                password: 'Whatever123!',
                passwordConfirm: 'Whatever123!',
            },
        })
        expect(res.status()).toBeGreaterThanOrEqual(400)
    })

    test('can reach /admin/routes', async ({ setterPage: page }) => {
        await gotoSettled(page, '/admin/routes')
        await expect(page.getByTestId('routes-create-open')).toBeVisible()
    })
})

test.describe('admin guard', () => {
    for (const path of ADMIN_PATHS) {
        test(`can reach ${path}`, async ({ adminPage: page }) => {
            await gotoSettled(page, path)
            await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
        })
    }
})
