import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import PocketBase from 'pocketbase'
import {
    authAsSuperuser,
    ensureLocations,
    ensureUser,
    getRoleIds,
    LOCATIONS,
    uiaa,
} from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a climber logs, edits and deletes an ascent', async ({
    page,
    testPrefix,
}) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const climber = await ensureUser(root, roleIds.user, 'user', testPrefix)
    const locations = await ensureLocations(root)
    const route = await root.collection('routes').create({
        name: `${testPrefix}-tick-route`,
        ...uiaa('6+'),
        location: locations[LOCATIONS[0]],
        type: 'Route',
        color: '#2196F3',
        creator: ['E2E'],
        screw_date: '2026-09-01',
    })

    await gotoSettled(page, '/auth/login')
    await page
        .getByTestId('login-identity')
        .locator('input')
        .fill(climber.email)
    await page
        .getByTestId('login-password')
        .locator('input')
        .fill(climber.password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))

    await gotoSettled(page, '/logbook')
    await expect(page.getByTestId('logbook-empty')).toBeVisible()

    await gotoSettled(page, `/route?id=${route.id}`)
    await expect(page.getByTestId('route-ticked')).toHaveCount(0)
    await page.getByTestId('tick-open').click()
    await page.getByTestId('tick-type-top').click()
    await page.getByTestId('tick-attempts').locator('input').fill('3')
    await page
        .getByTestId('tick-note')
        .locator('textarea')
        .first()
        .fill('Crux at the roof')
    await page.getByTestId('tick-submit').click()
    await expect(page.getByTestId('route-ticked')).toBeVisible()

    await gotoSettled(page, '/logbook')
    const tick = page.getByTestId('logbook-tick').filter({
        hasText: route.name,
    })
    await expect(tick.getByTestId('logbook-tick-route')).toHaveText(route.name)
    await expect(tick.getByTestId('logbook-tick-type')).toHaveText('Top')
    await expect(tick.getByTestId('logbook-tick-attempts')).toContainText('3')
    await expect(tick.getByTestId('logbook-tick-note')).toHaveText(
        'Crux at the roof',
    )

    await tick.getByTestId('logbook-tick-menu').click()
    await page.getByTestId('logbook-tick-edit').click()
    await page.getByTestId('tick-type-flash').click()
    await expect(
        page.getByTestId('tick-attempts').locator('input'),
    ).toBeDisabled()
    await page.getByTestId('tick-submit').click()
    await expect(tick.getByTestId('logbook-tick-type')).toHaveText('Flash')
    await expect(tick.getByTestId('logbook-tick-attempts')).toHaveCount(0)

    await root.collection('routes').update(route.id, { archived: true })
    await gotoSettled(page, '/logbook')
    await expect(tick.getByTestId('logbook-tick-route')).toHaveText(route.name)

    await tick.getByTestId('logbook-tick-menu').click()
    await page.getByTestId('logbook-tick-delete').click()
    await page.getByTestId('confirm-dialog-confirm').click()
    await expect(page.getByTestId('logbook-empty')).toBeVisible()

    await root.collection('routes').delete(route.id)
    await root.collection('users').delete(climber.id)
})
