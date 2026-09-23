import {
    test as base,
    type Browser,
    type BrowserContextOptions,
    type Page,
} from '@playwright/test'
import path from 'node:path'

const AUTH_DIR = path.join(__dirname, '..', '.auth')

type Role = 'admin' | 'routesetter' | 'user'

interface Fixtures {
    adminPage: Page
    setterPage: Page
    userPage: Page
    testPrefix: string
    deviceOptions: BrowserContextOptions
}

async function useRolePage(
    browser: Browser,
    deviceOptions: BrowserContextOptions,
    role: Role,
    use: (page: Page) => Promise<void>,
) {
    const context = await browser.newContext({
        ...deviceOptions,
        storageState: path.join(AUTH_DIR, `${role}.json`),
    })
    await use(await context.newPage())
    await context.close()
}

export const test = base.extend<Fixtures>({
    deviceOptions: async (
        {
            baseURL,
            viewport,
            userAgent,
            deviceScaleFactor,
            isMobile,
            hasTouch,
            locale,
        },
        use,
    ) => {
        await use({
            baseURL,
            ignoreHTTPSErrors: true,
            viewport,
            userAgent,
            deviceScaleFactor,
            isMobile,
            hasTouch,
            locale,
        })
    },
    adminPage: async ({ browser, deviceOptions }, use) =>
        useRolePage(browser, deviceOptions, 'admin', use),
    setterPage: async ({ browser, deviceOptions }, use) =>
        useRolePage(browser, deviceOptions, 'routesetter', use),
    userPage: async ({ browser, deviceOptions }, use) =>
        useRolePage(browser, deviceOptions, 'user', use),
    testPrefix: async ({}, use, testInfo) => {
        await use(`e2e-w${testInfo.workerIndex}-${Date.now()}`)
    },
})

export { expect } from '@playwright/test'
