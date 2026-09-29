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
    route,
}) => {
    const html = await (await page.request.get(`/route?id=${route.id}`)).text()
    expect(ogContent(html, 'og:title')).toBe(route.name)
    expect(ogContent(html, 'og:type')).toBe('article')
    expect(ogContent(html, 'og:description')).toContain(route.grade)
})
