import { Workbook } from '@cj-tech-master/excelts'
import { test, expect } from '../../support/fixtures'
import { authHeader, gotoSettled } from '../../support/nav'
import { LOCATIONS, locationId, uiaa } from '../../support/seed'

test('xlsx export writes the translated route type and a 6-digit colour fill', async ({
    adminPage: page,
    testPrefix,
}) => {
    await gotoSettled(page, '/manage/routes')
    const headers = await authHeader(page)
    const created = await page.request.post('/api/collections/routes/records', {
        headers,
        data: {
            name: `${testPrefix}-type`,
            ...uiaa('5'),
            location: await locationId(page, LOCATIONS[0]),
            type: 'Boulder',
            creator: ['E2E'],
            color: '#DA5307F6',
        },
    })
    const routeId = (await created.json()).id as string

    const response = await page.request.post('/api/ui/xlsx', {
        headers,
        data: {
            ids: [routeId],
            locale: 'de',
            columns: ['color', 'type'],
            typeLabels: { Boulder: 'Bouldern', Route: 'Route' },
        },
    })
    expect(response.ok()).toBe(true)

    const workbook = new Workbook()
    await workbook.xlsx.load(await response.body())
    const row = workbook.worksheets[0]!.getRow(2)
    expect(row.getCell(2).value).toBe('Bouldern')
    expect(row.getCell(1).fill).toMatchObject({
        fgColor: { argb: 'FFDA5307' },
    })

    await page.request.delete(`/api/collections/routes/records/${routeId}`, {
        headers,
    })
})

test('the export dialog sends type labels in the ui language', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    await page.getByTestId('routes-select-all').click()
    await page.getByTestId('routes-export-xlsx').click()

    const exportRequest = page.waitForRequest('**/api/ui/xlsx')
    await page.getByTestId('export-confirm').click()
    const body = (await exportRequest).postDataJSON()
    expect(body.typeLabels).toEqual({ Route: 'Route', Boulder: 'Boulder' })
})
