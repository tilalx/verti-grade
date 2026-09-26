import { test, expect } from '../../support/fixtures'

const ogContent = (html: string, property: string) =>
    html.match(
        new RegExp(`<meta property="${property}" content="([^"]*)"`),
    )?.[1]

test('server-renders open graph tags on the route list', async ({ page }) => {
    const html = await (await page.request.get('/')).text()
    expect(ogContent(html, 'og:title')).toBeTruthy()
    expect(ogContent(html, 'og:type')).toBe('website')
})

test('server-renders the route name as og:title on route pages', async ({
    page,
}) => {
    const res = await page.request.get(
        '/api/collections/routes/records?filter=' +
            encodeURIComponent('name ~ "e2e-route-" && archived = false') +
            '&perPage=1',
    )
    const route = (await res.json()).items[0]
    const html = await (await page.request.get(`/route?id=${route.id}`)).text()
    expect(ogContent(html, 'og:title')).toBe(route.name)
    expect(ogContent(html, 'og:type')).toBe('article')
    expect(ogContent(html, 'og:description')).toContain(
        String(route.difficulty),
    )
})
