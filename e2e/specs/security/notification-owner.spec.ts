import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser, ensureUser, getRoleIds } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

test('a user can mark a notification read but not hand it to someone else', async ({}, info) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const prefix = `notif-owner-w${info.workerIndex}`
    const owner = await ensureUser(root, roleIds.user, 'user', `${prefix}-a`)
    const victim = await ensureUser(root, roleIds.user, 'user', `${prefix}-b`)

    const notification = await root.collection('notifications').create({
        user: owner.id,
        type: 'report_filed',
        params: { snippet: prefix },
        url: '/manage/reports',
        read: false,
    })

    const client = new PocketBase(PB_URL)
    await client
        .collection('users')
        .authWithPassword(owner.email, owner.password)
    const notifications = client.collection('notifications')

    for (const change of [
        { user: victim.id },
        { url: '/auth/login' },
        { params: { snippet: 'spoofed' } },
        { type: 'report_decided_removed' },
    ]) {
        await expect(
            notifications.update(notification.id, change, { requestKey: null }),
        ).rejects.toMatchObject({ status: 404 })
    }

    const updated = await notifications.update(notification.id, { read: true })
    expect(updated.read).toBe(true)

    const stored = await root
        .collection('notifications')
        .getOne(notification.id)
    expect(stored.user).toBe(owner.id)
    expect(stored.url).toBe('/manage/reports')

    await root.collection('notifications').delete(notification.id)
})

test('only the recipient can see or touch a notification', async ({}, info) => {
    const root = new PocketBase(PB_URL)
    await authAsSuperuser(root)
    const roleIds = await getRoleIds(root)
    const prefix = `notif-read-w${info.workerIndex}`
    const owner = await ensureUser(root, roleIds.user, 'user', `${prefix}-a`)
    const other = await ensureUser(root, roleIds.admin, 'admin', `${prefix}-b`)

    const notification = await root.collection('notifications').create({
        user: owner.id,
        type: 'report_filed',
        params: { snippet: prefix },
        url: '/manage/reports',
        read: false,
    })

    const anonymous = new PocketBase(PB_URL)
    const otherUser = new PocketBase(PB_URL)
    await otherUser
        .collection('users')
        .authWithPassword(other.email, other.password)

    for (const client of [anonymous, otherUser]) {
        const notifications = client.collection('notifications')
        const listed = await notifications.getList(1, 200, {
            filter: client.filter('id = {:id}', { id: notification.id }),
            requestKey: null,
        })
        expect(listed.items).toHaveLength(0)
        await expect(
            notifications.getOne(notification.id, { requestKey: null }),
        ).rejects.toMatchObject({ status: 404 })
        await expect(
            notifications.update(
                notification.id,
                { read: true },
                { requestKey: null },
            ),
        ).rejects.toMatchObject({ status: 404 })
        await expect(
            notifications.delete(notification.id, { requestKey: null }),
        ).rejects.toMatchObject({ status: 404 })
    }

    const recipient = new PocketBase(PB_URL)
    await recipient
        .collection('users')
        .authWithPassword(owner.email, owner.password)
    const seen = await recipient
        .collection('notifications')
        .getOne(notification.id)
    expect(seen.read).toBe(false)

    await root.collection('notifications').delete(notification.id)
})
