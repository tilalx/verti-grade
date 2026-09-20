import { test as base, type Page } from '@playwright/test'
import path from 'node:path'

const AUTH_DIR = path.join(__dirname, '..', '.auth')

interface Fixtures {
    adminPage: Page
    setterPage: Page
    userPage: Page
    testPrefix: string
}

export const test = base.extend<Fixtures>({
    adminPage: async ({ browser, baseURL }, use) => {
        const context = await browser.newContext({
            storageState: path.join(AUTH_DIR, 'admin.json'),
            baseURL,
            ignoreHTTPSErrors: true,
        })
        const page = await context.newPage()
        await use(page)
        await context.close()
    },
    setterPage: async ({ browser, baseURL }, use) => {
        const context = await browser.newContext({
            storageState: path.join(AUTH_DIR, 'routesetter.json'),
            baseURL,
            ignoreHTTPSErrors: true,
        })
        const page = await context.newPage()
        await use(page)
        await context.close()
    },
    userPage: async ({ browser, baseURL }, use) => {
        const context = await browser.newContext({
            storageState: path.join(AUTH_DIR, 'user.json'),
            baseURL,
            ignoreHTTPSErrors: true,
        })
        const page = await context.newPage()
        await use(page)
        await context.close()
    },
    testPrefix: async ({}, use, testInfo) => {
        await use(`e2e-w${testInfo.workerIndex}-${Date.now()}`)
    },
})

export { expect } from '@playwright/test'
