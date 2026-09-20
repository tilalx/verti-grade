import type { Page } from '@playwright/test'

/**
 * Auth middleware runs client-side only, so first paint isn't the settled
 * state — always navigate through this helper instead of a bare page.goto().
 * Don't wait on 'networkidle': PocketBase's realtime SSE connection keeps
 * the network busy forever, hanging this past timeout. The NavBar is no
 * longer a hydration signal either (it server-renders now), so both layouts
 * carry a client-only 'page-hydrated' marker to wait on.
 */
export async function gotoSettled(
    page: Page,
    path: string,
    expectPath?: string | RegExp,
) {
    await page.goto(path)
    await page
        .locator('[data-testid="page-hydrated"]')
        .waitFor({ state: 'attached' })
    // Both layouts carry the hydration marker, so a server-side auth redirect
    // to /auth/login settles just as happily as the real page. Callers that
    // must be on the page they asked for say so, and get an honest failure
    // instead of a puzzling missing-element one further down.
    if (expectPath) await page.waitForURL(expectPath)
}

export async function assertSettledUrl(page: Page, path: string | RegExp) {
    await page.waitForURL(path)
}

/**
 * The auth cookie rides along on page.request.* automatically, but PocketBase
 * only accepts the token as an Authorization header — so it has to be pulled
 * out of the cookie and attached explicitly.
 */
export async function authHeader(
    page: Page,
): Promise<{ Authorization: string }> {
    const token = await page.evaluate(() => {
        const raw = document.cookie
            .split('; ')
            .find((c) => c.startsWith('pb_auth='))
        if (!raw) return ''
        try {
            return JSON.parse(
                decodeURIComponent(raw.split('=').slice(1).join('=')),
            ).token
        } catch {
            return ''
        }
    })
    return { Authorization: token }
}
