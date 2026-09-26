import { test, expect } from '@playwright/test'
import PocketBase from 'pocketbase'
import { authAsSuperuser } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

for (const [field, value] of [
    ['rating', -1000000],
    ['rating', 6],
    ['grade_index', 1e300],
] as const) {
    test(`an anonymous rating cannot store ${field} = ${value}`, async ({
        request,
    }) => {
        const root = new PocketBase(PB_URL)
        await authAsSuperuser(root)
        const [route] = (
            await root.collection('routes').getList(1, 1, { requestKey: null })
        ).items

        const created = await request.post('/api/collections/ratings/records', {
            data: { route_id: route!.id, rating: 3, [field]: value },
        })
        expect(created.status()).toBe(400)
        expect((await created.json()).data).toHaveProperty(field)
    })
}
