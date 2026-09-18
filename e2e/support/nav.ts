import type { Page } from '@playwright/test'

/**
 * ssrClientHints.reloadOnFirstRequest triggers a client-side reload on a
 * fresh browser context's first request, and auth middleware runs client-side
 * only (app/middleware/auth.js), so the first paint is not the settled state.
 * Always navigate through this helper instead of a bare page.goto().
 */
export async function gotoSettled(page: Page, path: string) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
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
