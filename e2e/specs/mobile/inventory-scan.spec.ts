import type { Page } from '@playwright/test'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'

/**
 * The inventory is scoped to one gym location. These tests pin that down:
 * finishing a stock-take at Hanau must never touch a Gelnhausen route, and an
 * unchecked route must survive the archive step.
 */

async function activeRoutesAt(page: Page, location: string) {
    const res = await page.request.get(
        '/api/collections/routes/records?' +
            new URLSearchParams({
                filter: `name ~ "e2e-route-" && archived = false && location = "${location}"`,
                perPage: '200',
                sort: 'name',
            }),
    )
    return (await res.json()).items as { id: string; name: string }[]
}

async function isArchived(page: Page, id: string) {
    const res = await page.request.get(`/api/collections/routes/records/${id}`)
    return (await res.json()).archived === true
}

/** Seeds a v2 session and reloads so the page picks it up. */
async function seedSession(page: Page, location: string, ids: string[]) {
    await page.evaluate(
        ({ location: loc, ids: scanned }) => {
            localStorage.setItem(
                'inventory-scanned-route-ids',
                JSON.stringify({ v: 2, location: loc, ids: scanned }),
            )
            localStorage.setItem('inventory-instructions-seen', '1')
        },
        { location, ids },
    )
    await page.reload()
    await page
        .locator('[data-testid="inventory-progress"]')
        .waitFor({ state: 'visible' })
}

test('archives only the checked routes at the scanned location', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/inventory')

    const hanau = await activeRoutesAt(page, 'Hanau')
    const gelnhausen = await activeRoutesAt(page, 'Gelnhausen')
    expect(hanau.length).toBeGreaterThan(2)
    expect(gelnhausen.length).toBeGreaterThan(0)

    // Everything at Hanau counted except the last two.
    const missing = hanau.slice(-2)
    const scanned = hanau.slice(0, -2)
    await seedSession(
        page,
        'Hanau',
        scanned.map((route) => route.id),
    )

    await expect(page.getByTestId('inventory-found-count')).toHaveText(
        String(scanned.length),
    )
    await expect(page.getByTestId('inventory-missing-count')).toHaveText('2')

    await page.getByTestId('inventory-finish-open').click()
    const dialog = page.getByTestId('inventory-finish-dialog')
    await expect(dialog).toBeVisible()

    // The review must not reach across sites.
    for (const route of gelnhausen) {
        await expect(
            page.getByTestId(`inventory-archive-toggle-${route.id}`),
        ).toHaveCount(0)
    }

    // Opt the second one out; only the first should be archived.
    const [toArchive, toKeep] = missing
    await page.getByTestId(`inventory-archive-toggle-${toKeep.id}`).click()
    await expect(page.getByTestId('inventory-finish-confirm')).toHaveText(
        /Archive\s+1\b/,
    )

    await page.getByTestId('inventory-finish-confirm').click()
    await expect(dialog).toBeHidden()

    expect(await isArchived(page, toArchive.id)).toBe(true)
    expect(await isArchived(page, toKeep.id)).toBe(false)

    // The other site is untouched — this is the regression that matters.
    expect((await activeRoutesAt(page, 'Gelnhausen')).length).toBe(
        gelnhausen.length,
    )

    // Leave the seed as we found it.
    await page.request.patch(
        `/api/collections/routes/records/${toArchive.id}`,
        { data: { archived: false }, headers: await authHeader(page) },
    )
})

test('requires a location before scanning can start', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/inventory')
    await page.evaluate(() => {
        localStorage.removeItem('inventory-scanned-route-ids')
        localStorage.setItem('inventory-instructions-seen', '1')
    })
    await page.reload()

    await expect(page.getByTestId('inventory-start')).toBeDisabled()
    await page.getByTestId('inventory-location-Hanau').click()
    await expect(page.getByTestId('inventory-start')).toBeEnabled()
})

test('restores a legacy session and asks which location it belongs to', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/inventory')

    const hanau = await activeRoutesAt(page, 'Hanau')
    // The pre-scoping storage shape: a bare array of ids.
    await page.evaluate(
        (ids) => {
            localStorage.setItem(
                'inventory-scanned-route-ids',
                JSON.stringify(ids),
            )
            localStorage.setItem('inventory-instructions-seen', '1')
        },
        [hanau[0].id, hanau[1].id],
    )
    await page.reload()
    await page
        .locator('[data-testid="inventory-progress"]')
        .waitFor({ state: 'visible' })

    // Unscoped: nothing is counted and nothing can be archived yet.
    await expect(page.getByTestId('inventory-found-count')).toHaveText('0')
    await expect(page.getByTestId('inventory-missing-count')).toHaveText('0')
    await expect(page.getByTestId('inventory-start')).toBeDisabled()

    await page.getByTestId('inventory-location-Hanau').click()

    await expect(page.getByTestId('inventory-found-count')).toHaveText('2')
    // The session is upgraded to the scoped shape on the next write.
    await expect
        .poll(async () =>
            page.evaluate(() =>
                JSON.parse(
                    localStorage.getItem('inventory-scanned-route-ids') || '{}',
                ),
            ),
        )
        .toMatchObject({ v: 2, location: 'Hanau' })
})
