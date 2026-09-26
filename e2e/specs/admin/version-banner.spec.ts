import { test, expect } from '../../support/fixtures'
import { gotoSettled } from '../../support/nav'
import type { Page } from '@playwright/test'

const DISMISS_KEY = 'verti-grade:update-dismissed'

const RELEASE_PAYLOAD = {
    installed: {
        raw: '1.9.0',
        base: '1.9.0',
        ahead: 0,
        sha: null,
        notes: '## Installed\n* the running build',
    },
    latest: {
        tag: 'v1.10.0',
        notes: '## What changed\n* **Bold** fix\n* https://github.com/o/r/pull/42',
        publishedAt: '2026-01-02T00:00:00Z',
    },
    commits: [],
    mode: 'release',
    updateAvailable: true,
    error: null,
}

const COMMIT_PAYLOAD = {
    installed: {
        raw: '1.9.0-2-gabc1234',
        base: '1.9.0',
        ahead: 2,
        sha: 'abc1234',
        notes: null,
    },
    latest: { tag: 'v1.9.0', notes: 'notes', publishedAt: null },
    commits: [
        {
            sha: 'bbbbbbb',
            message: 'second commit',
            date: '2026-01-02T00:00:00Z',
        },
        {
            sha: 'aaaaaaa',
            message: 'first commit',
            date: '2026-01-01T00:00:00Z',
        },
    ],
    mode: 'commit',
    updateAvailable: true,
    error: null,
}

const UP_TO_DATE = {
    installed: {
        raw: '1.9.0',
        base: '1.9.0',
        ahead: 0,
        sha: null,
        notes: 'notes',
    },
    latest: { tag: 'v1.9.0', notes: 'notes', publishedAt: null },
    commits: [],
    mode: 'none',
    updateAvailable: false,
    error: null,
}

async function stubVersion(page: Page, payload: unknown) {
    await page.route('**/api/version', (route) =>
        route.fulfill({ json: payload }),
    )
}

test('announces a new release and opens its notes', async ({
    adminPage: page,
}) => {
    await stubVersion(page, RELEASE_PAYLOAD)
    await gotoSettled(page, '/')

    const banner = page.getByTestId('update-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('v1.10.0')

    await page.getByTestId('update-banner-changelog').click()

    const dialog = page.getByTestId('release-notes-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('v1.10.0')
    await expect(dialog).toContainText('Bold fix')
    await expect(dialog).not.toContainText('**')
    await expect(dialog.locator('a[href$="/pull/42"]')).toHaveText('#42')
})

test('announces new commits and lists them', async ({ adminPage: page }) => {
    await stubVersion(page, COMMIT_PAYLOAD)
    await gotoSettled(page, '/')

    const banner = page.getByTestId('update-banner')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('2 new commits')

    await page.getByTestId('update-banner-commits').click()

    const dialog = page.getByTestId('commit-list-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('bbbbbbb')
    await expect(dialog).toContainText('second commit')

    const deployed = (
        await page.getByTestId('footer-version').innerText()
    ).trim()
    await expect(dialog).toContainText(deployed)
})

test('stays hidden when the deployment is current', async ({
    adminPage: page,
}) => {
    await stubVersion(page, UP_TO_DATE)
    await gotoSettled(page, '/')

    await expect(page.getByTestId('user-menu-activator')).toBeVisible()
    await expect(page.getByTestId('update-banner')).toBeHidden()
})

test('a dismissal survives a reload but a newer release reappears', async ({
    adminPage: page,
}) => {
    await stubVersion(page, RELEASE_PAYLOAD)
    await gotoSettled(page, '/')

    await page
        .getByTestId('update-banner')
        .getByRole('button', { name: 'Dismiss' })
        .click()
    await expect(page.getByTestId('update-banner')).toBeHidden()

    await gotoSettled(page, '/')
    await expect(page.getByTestId('update-banner')).toBeHidden()
    expect(
        await page.evaluate((k) => localStorage.getItem(k), DISMISS_KEY),
    ).toBe('v1.10.0')

    await stubVersion(page, {
        ...RELEASE_PAYLOAD,
        latest: { ...RELEASE_PAYLOAD.latest, tag: 'v1.11.0' },
    })
    await gotoSettled(page, '/')
    await expect(page.getByTestId('update-banner')).toBeVisible()
})

test('the footer pill shows the installed release notes to a logged-out visitor', async ({
    page,
}) => {
    await stubVersion(page, UP_TO_DATE)
    await gotoSettled(page, '/')

    await expect(page.getByTestId('update-banner')).toBeHidden()

    await page.getByTestId('footer-version').click()

    const dialog = page.getByTestId('release-notes-dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('notes')
})
