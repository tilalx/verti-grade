import type { Page } from '@playwright/test'

/**
 * ssrClientHints.reloadOnFirstRequest triggers a client-side reload on a
 * fresh browser context's first request, and auth middleware runs client-side
 * only (app/middleware/auth.js), so the first paint is not the settled state.
 * Always navigate through this helper instead of a bare page.goto().
 *
 * Every page keeps a PocketBase realtime SSE connection open (layouts/
 * default.vue and friends), so the network never goes idle — don't wait on
 * 'networkidle', it hangs until timeout (esp. in WebKit). NavBar only
 * renders its right-side action client-side (inside <ClientOnly>) — login
 * button (logged out), hamburger (logged in + mobile), or the user menu
 * (logged in + desktop) — after any ssrClientHints reload has already
 * happened, so waiting for any one of those is a reliable "hydrated" signal.
 */
export async function gotoSettled(page: Page, path: string) {
    await page.goto(path)
    await page
        .locator(
            '[data-testid="nav-login"], [data-testid="nav-hamburger"], [data-testid="user-menu-activator"]',
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
