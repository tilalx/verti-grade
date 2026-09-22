import type { Page } from '@playwright/test'

export async function gotoSettled(
    page: Page,
    path: string,
    expectPath?: string | RegExp,
) {
    await page.goto(path)
    await page
        .locator('[data-testid="page-hydrated"]')
        .waitFor({ state: 'attached' })
    if (expectPath) await page.waitForURL(expectPath)
}

export async function assertSettledUrl(page: Page, path: string | RegExp) {
    await page.waitForURL(path)
}

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
