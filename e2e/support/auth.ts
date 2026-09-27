import PocketBase from 'pocketbase'
import { test, type Page } from '@playwright/test'

const PB_URL = process.env.E2E_PB_URL || 'https://localhost'

export async function signInAs(page: Page, email: string, password: string) {
    const pb = new PocketBase(PB_URL)
    await pb.collection('users').authWithPassword(email, password)
    const cookie = pb.authStore.exportToCookie({}, 'pb_auth')
    const baseURL = test.info().project.use.baseURL!
    await page.context().addCookies([
        {
            name: 'pb_auth',
            value: cookie.slice('pb_auth='.length, cookie.indexOf(';')),
            url: baseURL,
        },
    ])
}
