import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { authAsSuperuser } from '../../support/seed'
import { gotoSettled } from '../../support/nav'
import { PB_URL, seedMap } from '../../support/map'

test.use({ viewport: { width: 360, height: 740 } })

test('route hero chips wrap instead of being clipped', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const seeded = await seedMap(root, `${testPrefix}-long-location-name`, {
        routes: 1,
    })
    try {
        await gotoSettled(page, `/route?id=${seeded.routeIds[0]}`)
        const hero = page.getByTestId('route-hero')
        await expect(page.getByTestId('route-wall')).toBeVisible()

        const heroBox = (await hero.boundingBox())!
        const chipBoxes = await hero
            .locator('.route-hero__chips .v-chip')
            .evaluateAll((chips) =>
                chips.map((chip) => chip.getBoundingClientRect().toJSON()),
            )
        expect(chipBoxes.length).toBeGreaterThan(1)
        for (const box of chipBoxes)
            expect(box.right).toBeLessThanOrEqual(heroBox.x + heroBox.width)
        const rows = new Set(chipBoxes.map((box) => Math.round(box.top)))
        expect(rows.size).toBeGreaterThan(1)
    } finally {
        await seeded.cleanup()
    }
})

test('icon buttons have a 44px touch target', async ({ page, testPrefix }) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const seeded = await seedMap(root, testPrefix, { routes: 1 })
    try {
        await gotoSettled(page, `/route?id=${seeded.routeIds[0]}`)
        const back = page.getByTestId('route-back')
        await expect(back).toBeVisible()
        const box = (await back.boundingBox())!

        const centerX = box.x + box.width / 2
        const centerY = box.y + box.height / 2
        const hits = await page.evaluate(
            (points) =>
                points.map(
                    ([x, y]) =>
                        !!document
                            .elementFromPoint(x!, y!)
                            ?.closest('[data-testid="route-back"]'),
                ),
            [
                [centerX - 21, centerY],
                [centerX + 21, centerY],
                [centerX, centerY - 21],
                [centerX, centerY + 21],
            ],
        )
        expect(hits).toEqual([true, true, true, true])
    } finally {
        await seeded.cleanup()
    }
})

test('settings asset actions are visible without hover', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')
    const actions = page.getByTestId('settings-asset-actions-logo')
    await expect(actions).toBeVisible()
    await expect(actions).toHaveCSS('opacity', '1')
})

test('import preview renders as a list on phones', async ({
    adminPage: page,
    testPrefix,
}) => {
    const name = `${testPrefix}-import-preview`
    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('routes-more').click()
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByTestId('routes-import-open').click()
    const chooser = await fileChooserPromise
    await chooser.setFiles({
        name: `${name}.json`,
        mimeType: 'application/json',
        buffer: Buffer.from(
            JSON.stringify([{ name, difficulty: 8, anchor_point: 3 }]),
        ),
    })

    const list = page.getByTestId('import-route-list')
    await expect(list).toBeVisible()
    await expect(list).toContainText(name)
    await page.getByTestId('import-route-cancel').click()
    await expect(page.getByTestId('import-route-dialog')).toBeHidden()
})
