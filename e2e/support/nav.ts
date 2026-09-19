import type { Page } from '@playwright/test'

/**
 * Auth middleware runs client-side only, so first paint isn't the settled
 * state — always navigate through this helper instead of a bare page.goto().
 * Don't wait on 'networkidle': PocketBase's realtime SSE connection keeps
 * the network busy forever, hanging this past timeout. Instead wait for
 * NavBar's client-only right-side action (login/hamburger/user-menu) or,
 * on NavBar-less layouts (blank.vue), the 'page-hydrated' marker.
 */
export async function gotoSettled(page: Page, path: string) {
    await page.goto(path)
    await page
        .locator(
            '[data-testid="nav-login"], [data-testid="nav-hamburger"], [data-testid="user-menu-activator"], [data-testid="page-hydrated"]',
        )
        .first()
        .waitFor({ state: 'attached' })
}

export async function assertSettledUrl(page: Page, path: string | RegExp) {
    await page.waitForURL(path)
}

/**
 * page.request shares the browser context's cookies, but PocketBase's JS
 * SDK stores its auth token in localStorage and sends it as an Authorization
 * header — so page.request.* calls are unauthenticated unless this header is
 * attached explicitly.
 */
export async function authHeader(
    page: Page,
): Promise<{ Authorization: string }> {
    const raw = await page.evaluate(() =>
        localStorage.getItem('pocketbase_auth'),
    )
    const token = raw ? JSON.parse(raw).token : ''
    return { Authorization: token }
}
