import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'https://localhost'

export default defineConfig({
    testDir: './e2e/specs',
    outputDir: './e2e/results/artifacts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
    reporter: process.env.CI
        ? [
              ['list'],
              ['junit', { outputFile: 'e2e/results/junit.xml' }],
              ['html', { outputFolder: 'e2e/results/html', open: 'never' }],
          ]
        : 'list',
    globalSetup: './e2e/support/global-setup.ts',
    use: {
        baseURL,
        ignoreHTTPSErrors: true,
        trace: 'retain-on-failure',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'desktop-en',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
                locale: 'en-US',
            },
            testIgnore: ['**/i18n/**', '**/mobile/**'],
        },
        {
            name: 'mobile-en',
            use: {
                ...devices['Pixel 7'],
                locale: 'en-US',
            },
            testMatch: ['**/mobile/**', '**/auth/**'],
            testIgnore: ['**/auth/guards.spec.ts'],
        },
        {
            name: 'i18n-de',
            use: { ...devices['Desktop Chrome'], locale: 'de-DE' },
            testMatch: ['**/i18n/**'],
        },
        {
            name: 'i18n-ru',
            use: { ...devices['Desktop Chrome'], locale: 'ru-RU' },
            testMatch: ['**/i18n/**'],
        },
        {
            name: 'i18n-tr',
            use: { ...devices['Desktop Chrome'], locale: 'tr-TR' },
            testMatch: ['**/i18n/**'],
        },
        {
            name: 'i18n-uk',
            use: { ...devices['Desktop Chrome'], locale: 'uk-UA' },
            testMatch: ['**/i18n/**'],
        },
        {
            name: 'firefox-smoke',
            use: { ...devices['Desktop Firefox'], locale: 'en-US' },
            testMatch: ['**/auth/**', '**/public/index-list.spec.ts'],
            testIgnore: ['**/auth/guards.spec.ts'],
        },
        {
            name: 'webkit-smoke',
            use: { ...devices['Desktop Safari'], locale: 'en-US' },
            testMatch: ['**/auth/**', '**/public/index-list.spec.ts'],
            testIgnore: ['**/auth/guards.spec.ts'],
        },
    ],
})
