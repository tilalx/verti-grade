import { test, expect } from '../../support/fixtures'
import { gotoSubscribed } from '../../support/nav'

test('a filed and fixed defect shows up live on the open route page', async ({
    page,
    root,
    route,
}) => {
    await gotoSubscribed(page, `/route?id=${route.id}`, 'open_route_defects')
    const banner = page.getByTestId('task-defect-banner')
    await expect(banner).toHaveCount(0)

    const task = await root.collection('tasks').create({
        kind: 'defect',
        route: route.id,
        category: 'loose_hold',
    })
    await expect(banner).toBeVisible()

    await root.collection('tasks').update(task.id, { status: 'done' })
    await expect(banner).toHaveCount(0)
})
