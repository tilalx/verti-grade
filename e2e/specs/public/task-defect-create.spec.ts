import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { PNG_PIXEL } from '../../support/tasks'

test('a visitor reports a defect with a photo and sees the known-issue banner', async ({
    page,
    root,
    route,
    testPrefix,
}) => {
    await gotoSettled(page, `/route?id=${route.id}`)
    await expect(page.getByTestId('task-defect-banner')).toBeHidden()

    await page.getByTestId('task-defect-open').click()
    const dialog = page.getByTestId('task-defect-dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByTestId('task-defect-submit')).toBeDisabled()

    await page.getByTestId('task-defect-category-loose_bolt').click()
    await page
        .getByTestId('task-defect-description')
        .fill(`${testPrefix} bolt at the third clip turns`)
    await dialog.locator('input[type="file"]').setInputFiles({
        name: 'bolt.png',
        mimeType: 'image/png',
        buffer: PNG_PIXEL,
    })
    await page.getByTestId('task-defect-submit').click()

    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('task-defect-banner')).toBeVisible()

    const task = await root
        .collection('tasks')
        .getFirstListItem(root.filter('route = {:id}', { id: route.id }))
    expect(task).toMatchObject({
        kind: 'defect',
        category: 'loose_bolt',
        priority: 4,
        status: 'open',
        reporter: '',
    })
    expect(task.photo).toBeTruthy()
})

test('visitors cannot read task details, only the public defect summary', async ({
    page,
    root,
    route,
    testPrefix,
}) => {
    await root.collection('tasks').create({
        kind: 'defect',
        route: route.id,
        category: 'sharp_edge',
        description: `${testPrefix} private details`,
    })

    const tasks = await page.request.get('/api/collections/tasks/records')
    expect((await tasks.json()).items ?? []).toHaveLength(0)

    const summary = await page.request.get(
        `/api/collections/open_route_defects/records?filter=${encodeURIComponent(`route="${route.id}"`)}`,
    )
    const [defect] = (await summary.json()).items
    expect(defect.category).toBe('sharp_edge')
    expect(defect).not.toHaveProperty('description')
})

test('a visitor cannot file a staff task', async ({ page, root, route }) => {
    const res = await page.request.post('/api/collections/tasks/records', {
        data: {
            kind: 'reset',
            title: 'Strip everything',
            route: route.id,
            category: 'other',
            priority: 1,
        },
    })
    expect(res.ok()).toBe(true)
    const task = await root.collection('tasks').getOne((await res.json()).id)
    expect(task).toMatchObject({ kind: 'defect', title: '', priority: 2 })
})
