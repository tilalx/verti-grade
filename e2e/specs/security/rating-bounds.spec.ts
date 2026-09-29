import { test, expect } from '../../support/fixtures'

for (const [field, value] of [
    ['rating', -1000000],
    ['rating', 6],
    ['grade_index', 1e300],
] as const) {
    test(`an anonymous rating cannot store ${field} = ${value}`, async ({
        request,
        route,
    }) => {
        const created = await request.post('/api/collections/ratings/records', {
            data: { route_id: route.id, rating: 3, [field]: value },
        })
        expect(created.status()).toBe(400)
        expect((await created.json()).data).toHaveProperty(field)
    })
}
