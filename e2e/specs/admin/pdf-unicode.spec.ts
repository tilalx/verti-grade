import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { LOCATIONS, locationId } from '../../support/seed'

test('pdf labels embed a unicode font for cyrillic and turkish text', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const created = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name: `${testPrefix}-Скала İzmir`,
            difficulty: 6,
            anchor_point: 12,
            location: await locationId(page, LOCATIONS[0]),
            type: 'Route',
            creator: ['Рутсеттер'],
            color: '#ff0000',
        },
    })
    const routeId = (await created.json()).id as string

    const response = await page.request.post('/api/ui/pdf', {
        headers,
        data: { ids: [routeId], labels: { anchor: 'Станция' } },
    })
    expect(response.ok()).toBe(true)
    const pdf = (await response.body()).toString('latin1')

    expect(pdf.startsWith('%PDF')).toBe(true)
    expect(pdf).toMatch(/\/BaseFont \/[A-Z]{6}\+Roboto-Regular/)
    expect(pdf).toMatch(/\/BaseFont \/[A-Z]{6}\+Roboto-Bold/)
    expect(pdf).not.toContain('/BaseFont /Helvetica')

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
})
