import { chromium, type FullConfig } from '@playwright/test'
import PocketBase from 'pocketbase'
import fs from 'node:fs'
import path from 'node:path'
import {
    authAsSuperuser,
    ensureUser,
    getRoleIds,
    seedRatings,
    seedRoutes,
} from './seed'

const AUTH_DIR = path.join(__dirname, '..', '.auth')
const PB_URL = process.env.E2E_PB_URL || 'https://localhost'
const PREFIX = 'e2e'

async function saveStorageState(
    baseURL: string,
    email: string,
    password: string,
    file: string,
) {
    const browser = await chromium.launch()
    const context = await browser.newContext({
        baseURL,
        ignoreHTTPSErrors: true,
    })
    const page = await context.newPage()
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.getByTestId('login-identity').locator('input').fill(email)
    await page.getByTestId('login-password').locator('input').fill(password)
    await page.getByTestId('login-submit').click()
    // Every role lands somewhere different post-login (admin -> /admin/routes,
    // a plain "user" role has no admin permissions and bounces to /), so the
    // only role-independent success signal is "left the login page".
    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'))
    await context.storageState({ path: file })
    await browser.close()
}

export default async function globalSetup(config: FullConfig) {
    const pb = new PocketBase(PB_URL)
    await authAsSuperuser(pb)

    const roleIds = await getRoleIds(pb)
    const admin = await ensureUser(pb, roleIds.admin, 'admin', PREFIX)
    const setter = await ensureUser(
        pb,
        roleIds.routesetter,
        'routesetter',
        PREFIX,
    )
    const user = await ensureUser(pb, roleIds.user, 'user', PREFIX)

    const routes = await seedRoutes(pb, PREFIX)
    await seedRatings(pb, PREFIX, routes)

    fs.mkdirSync(AUTH_DIR, { recursive: true })

    const baseURL =
        config.projects[0]?.use?.baseURL ||
        process.env.E2E_BASE_URL ||
        'https://localhost'

    for (const [role, u] of [
        ['admin', admin],
        ['routesetter', setter],
        ['user', user],
    ] as const) {
        await saveStorageState(
            baseURL,
            u.email,
            u.password,
            path.join(AUTH_DIR, `${role}.json`),
        )
    }
}
