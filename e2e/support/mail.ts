import type { APIRequestContext, Page } from '@playwright/test'

/**
 * Mailpit, the SMTP catcher the e2e stack points PocketBase at
 * (e2e/docker-compose.e2e.yml). Without it nothing could assert that a mail
 * was actually sent, only that the code path was entered — which is how the
 * DSA Art. 16(5) decision notice stayed broken: a truthy empty date made the
 * hook skip the send every time, silently.
 *
 * Every test addresses its own recipient, so searching by `to:` isolates it
 * from the siblings `fullyParallel` runs alongside.
 */
const MAILPIT = process.env.MAILPIT_URL || 'http://mailpit:8025'

interface MailSummary {
    ID: string
    Subject: string
}

interface MailMessage {
    ID: string
    Subject: string
    Text: string
    HTML: string
}

function api(page: Page | APIRequestContext): APIRequestContext {
    return 'request' in page ? page.request : page
}

/** Unique recipient for one test, so no sibling can pollute the assertion. */
export function mailbox(prefix: string, label: string): string {
    return `${prefix}-${label}@verti-grade.test`
}

/**
 * Waits for a mail addressed to `to`, optionally one whose subject matches.
 * Polls rather than sleeps: delivery is a second hop after the HTTP response.
 */
export async function waitForMail(
    page: Page | APIRequestContext,
    to: string,
    options: {
        subject?: RegExp
        /**
         * Pin to this test's own mail. Shared recipients (the moderator alert
         * goes to every manage_reports holder) collect siblings' mail too, and
         * matching on subject alone would assert against the wrong one.
         */
        bodyIncludes?: string
        timeoutMs?: number
    } = {},
): Promise<MailMessage> {
    const request = api(page)
    const deadline = Date.now() + (options.timeoutMs ?? 15_000)

    let lastSeen: string[] = []
    while (Date.now() < deadline) {
        const res = await request.get(
            `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
        )
        if (res.ok()) {
            const items: MailSummary[] = (await res.json()).messages ?? []
            lastSeen = items.map((item) => item.Subject)

            const candidates = options.subject
                ? items.filter((item) => options.subject!.test(item.Subject))
                : items

            for (const candidate of candidates) {
                const message = await readMail(page, candidate.ID)
                if (
                    !options.bodyIncludes ||
                    `${message.HTML || ''}${message.Text || ''}`.includes(
                        options.bodyIncludes,
                    )
                ) {
                    return message
                }
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 400))
    }

    throw new Error(
        `No mail to ${to}${
            options.subject ? ` matching ${options.subject}` : ''
        } within the timeout. Subjects seen: ${JSON.stringify(lastSeen)}`,
    )
}

/** Asserts nothing arrives — used where a notice must NOT be sent. */
export async function expectNoMail(
    page: Page | APIRequestContext,
    to: string,
    windowMs = 3000,
): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, windowMs))
    const res = await api(page).get(
        `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    )
    const items: MailSummary[] = (await res.json()).messages ?? []
    if (items.length) {
        throw new Error(
            `Expected no mail to ${to}, got: ${JSON.stringify(
                items.map((i) => i.Subject),
            )}`,
        )
    }
}

export async function readMail(
    page: Page | APIRequestContext,
    id: string,
): Promise<MailMessage> {
    const res = await api(page).get(`${MAILPIT}/api/v1/message/${id}`)
    return (await res.json()) as MailMessage
}

/** Every mail this inbox holds, for counting duplicates. */
export async function mailCount(
    page: Page | APIRequestContext,
    to: string,
): Promise<number> {
    const res = await api(page).get(
        `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    )
    return ((await res.json()).messages ?? []).length
}

/**
 * The first app link in a mail body, as a path.
 *
 * Templates interpolate {APP_URL}, which the e2e stack pins to the app's own
 * origin — so a link that still pointed into the PocketBase superuser panel
 * (`/_/#/auth/...`) comes back with that prefix intact and fails the assertion
 * rather than quietly working.
 */
export function linkPath(message: MailMessage, pattern: RegExp): string {
    const body = `${message.HTML || ''}\n${message.Text || ''}`
    const match = body.match(pattern)
    if (!match) {
        throw new Error(
            `No link matching ${pattern} in mail "${message.Subject}"`,
        )
    }
    return match[0].replace(/^https?:\/\/[^/]+/, '').replace(/&amp;/g, '&')
}

/** Drops everything Mailpit holds. Only for tests that must count globally. */
export async function clearMailbox(page: Page | APIRequestContext) {
    await api(page).delete(`${MAILPIT}/api/v1/messages`)
}
