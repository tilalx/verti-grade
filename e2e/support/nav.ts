import { expect, type Page } from '@playwright/test'

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

export async function gotoSubscribed(page: Page, path: string, topic: string) {
    const subscribed = page.waitForResponse(
        (response) =>
            response.url().includes('/api/realtime') &&
            response.request().method() === 'POST' &&
            !!response.request().postData()?.includes(topic),
    )
    await gotoSettled(page, path)
    await subscribed
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

export async function searchRoutes(page: Page, text: string) {
    const filtered = page.waitForResponse(
        (response) =>
            response.url().includes('/api/collections/averageRating/records') &&
            decodeURIComponent(response.url()).includes(`name ~ "${text}"`),
    )
    await page.getByTestId('filter-search').fill(text)
    await filtered
}

export async function waitForOverview(
    page: Page,
    routeId: string,
    ratingsCount = 0,
) {
    await expect
        .poll(async () => {
            const response = await page.request.get('/api/public/overview')
            const rows = (await response.json()) as {
                id: string
                ratings_count?: number
            }[]
            return rows.find((row) => row.id === routeId)?.ratings_count
        })
        .toBe(ratingsCount)
}
