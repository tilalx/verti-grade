import PocketBase from 'pocketbase'
import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import { LOCATIONS, authAsSuperuser, gradeOf } from '../../support/seed'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

async function superuserPb() {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)
    return pb
}

test('settings show the grading scale per route type', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/admin/settings')

    const routeScale = page.getByTestId('settings-route-grade-system')
    const boulderScale = page.getByTestId('settings-boulder-grade-system')
    await expect(routeScale).toContainText('UIAA')
    await expect(boulderScale).toContainText('Fontainebleau')

    await routeScale.click()
    for (const name of ['UIAA', 'French', 'YDS']) {
        await expect(
            page.getByRole('option', { name, exact: true }),
        ).toBeVisible()
    }
    await page.keyboard.press('Escape')

    await boulderScale.click()
    for (const name of ['Fontainebleau', 'V-Scale']) {
        await expect(
            page.getByRole('option', { name, exact: true }),
        ).toBeVisible()
    }
})

test('creates a boulder graded on the boulder scale', async ({
    adminPage: page,
}) => {
    await gotoSettled(page, '/manage/routes')
    const name = `e2e-bldr-${Date.now()}`

    await page.getByTestId('routes-create-open').click()
    await page.getByTestId('route-form-name').locator('input').fill(name)
    await page.getByTestId('route-form-type').click()
    await page.getByRole('option', { name: 'Boulder', exact: true }).click()
    await expect(page.getByTestId('route-form-difficulty')).toContainText(
        'Fontainebleau',
    )
    await page.getByTestId('route-form-difficulty').click()
    await page.getByRole('option', { name: '6A+', exact: true }).click()
    await page.getByTestId('route-form-anchor-point').locator('input').fill('0')
    await page.getByTestId('route-form-location').click()
    await page.getByRole('option', { name: LOCATIONS[0], exact: true }).click()
    await page.getByTestId('route-form-creator').locator('input').fill('E2E')
    await page.keyboard.press('Enter')
    await page
        .getByTestId('route-form-screw-date')
        .locator('input')
        .fill('2026-01-01')
    await page.getByTestId('route-form-submit').click()
    await expect(page.getByTestId('route-form-dialog')).toBeHidden()

    const pb = await superuserPb()
    const created = await pb
        .collection('routes')
        .getFirstListItem(`name = "${name}"`)
    try {
        expect(created).toMatchObject({
            grade: '6A+',
            grade_system: 'font',
            grade_index: 16.4,
        })
        await page.getByTestId('filter-search').locator('input').fill(name)
        await expect(page.getByTestId('routes-table')).toContainText('6A+')
        await expect(
            page.getByTestId('routes-table').locator('tbody'),
        ).not.toContainText('Font')
    } finally {
        await pb.collection('routes').delete(created.id)
    }
})

test('editing keeps the route scale and switching type resets the grade', async ({
    adminPage: page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    const name = `${testPrefix}-french-route`
    const route = await pb.collection('routes').create({
        name,
        ...gradeOf('french', '6b'),
        type: 'Route',
        anchor_point: 3,
        creator: ['E2E'],
    })
    try {
        await gotoSettled(page, '/manage/routes')
        await page.getByTestId('filter-search').locator('input').fill(name)
        await expect(page.getByTestId('routes-table')).toContainText('6b')
        await expect(page.getByTestId('routes-table')).toContainText('Fr')
        await expect(
            page.getByTestId('routes-table').locator('thead'),
        ).toContainText('Grade (UIAA · Font)')

        await page.getByTestId('routes-row-edit').first().click()
        const grade = page.getByTestId('route-form-difficulty')
        await expect(grade).toContainText('French')
        await expect(grade).toContainText('6b')

        await page.getByTestId('route-form-type').click()
        await page.getByRole('option', { name: 'Boulder', exact: true }).click()
        await expect(grade).toContainText('Fontainebleau')
        await expect(grade).not.toContainText('6b')

        await page.getByTestId('route-form-type').click()
        await page.getByRole('option', { name: 'Route', exact: true }).click()
        await expect(grade).toContainText('French')
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('route page links its grade to the IRCRA conversion table', async ({
    page,
    testPrefix,
}) => {
    const pb = await superuserPb()
    const route = await pb.collection('routes').create({
        name: `${testPrefix}-conversion`,
        ...gradeOf('french', '7a'),
        type: 'Route',
        anchor_point: 2,
        creator: ['E2E'],
    })
    try {
        await gotoSettled(page, `/route?id=${route.id}`)
        await expect(page.getByTestId('route-grade-system')).toHaveText('Fr')
        await page.getByTestId('route-grade-badge').click()

        const dialog = page.getByTestId('grade-conversion-dialog')
        await expect(dialog).toContainText('IRCRA')
        await expect(
            dialog.getByTestId('grade-conversion-french-7a'),
        ).toHaveClass(/grade-conversion__label--highlight/)
        await expect(dialog.getByTestId('grade-conversion-band')).toBeVisible()
        for (const testId of [
            'grade-conversion-yds-5.11d',
            'grade-conversion-uiaa-8',
            'grade-conversion-font-6B',
            'grade-conversion-v-V3',
            'grade-conversion-britishTech-6a',
            'grade-conversion-ewbank-23',
            'grade-conversion-brazilian-7c',
            'grade-conversion-metricUiaa-8.00',
            'grade-conversion-watts-2.75',
            'grade-conversion-male-Intermediate (L2)',
            'grade-conversion-female-Advanced (L3)',
        ]) {
            await expect(dialog.getByTestId(testId)).toBeVisible()
        }
    } finally {
        await pb.collection('routes').delete(route.id)
    }
})

test('settings open the conversion table', async ({ adminPage: page }) => {
    await gotoSettled(page, '/admin/settings')
    await page.getByTestId('grade-conversion-open').click()
    await expect(page.getByTestId('grade-conversion-dialog')).toBeVisible()
    await expect(page.getByTestId('grade-conversion-french-6a')).toBeVisible()
})
