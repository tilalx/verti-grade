import { test, expect } from '@playwright/test'
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
const DAY = '2026-09-26 12:00:00.000Z'

async function signIn(email: string, password: string) {
    const client = new PocketBase(PB_URL)
    await client.collection('users').authWithPassword(email, password)
    return client
}

test('ticks stay private to their owner and keep the grade they were logged at', async ({}, info) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const prefix = `tick-owner-w${info.workerIndex}`
    const owner = await ensureUser(root, roleIds.user, 'user', `${prefix}-a`)
    const other = await ensureUser(root, roleIds.user, 'user', `${prefix}-b`)
    const locations = await ensureLocations(root)
    const route = await root.collection('routes').create({
        name: `${prefix}-route`,
        ...uiaa('7-'),
        location: locations[LOCATIONS[0]],
        type: 'Route',
        creator: ['E2E'],
        screw_date: '2026-09-01',
    })

    const ownerClient = await signIn(owner.email, owner.password)
    const otherClient = await signIn(other.email, other.password)

    const tick = await ownerClient.collection('ticks').create({
        user: owner.id,
        route: route.id,
        type: 'flash',
        attempts: 7,
        date: DAY,
        grade: '11',
    })
    expect(tick.grade).toBe('7-')
    expect(tick.grade_system).toBe('uiaa')
    expect(tick.attempts).toBe(1)

    await root.collection('routes').update(route.id, uiaa('7'))
    expect((await ownerClient.collection('ticks').getOne(tick.id)).grade).toBe(
        '7-',
    )

    await expect(
        otherClient.collection('ticks').create({
            user: owner.id,
            route: route.id,
            type: 'top',
            attempts: 1,
            date: DAY,
        }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
        otherClient.collection('ticks').getOne(tick.id),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
        otherClient.collection('ticks').update(tick.id, { note: 'mine now' }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
        otherClient.collection('ticks').delete(tick.id),
    ).rejects.toMatchObject({ status: 404 })
    expect(
        (await otherClient.collection('ticks').getList(1, 50)).items.map(
            (item) => item.id,
        ),
    ).not.toContain(tick.id)
    expect(
        (await new PocketBase(PB_URL).collection('ticks').getList(1, 50))
            .totalItems,
    ).toBe(0)

    for (const change of [
        { user: other.id },
        { grade: '11' },
        { route: 'another-route' },
    ]) {
        await expect(
            ownerClient.collection('ticks').update(tick.id, change),
        ).rejects.toMatchObject({ status: 404 })
    }

    await root.collection('users').delete(owner.id)
    await expect(
        root.collection('ticks').getOne(tick.id),
    ).rejects.toMatchObject({ status: 404 })

    await root.collection('users').delete(other.id)
    await root.collection('routes').delete(route.id)
})
