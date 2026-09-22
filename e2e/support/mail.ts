import type { APIRequestContext, Page } from '@playwright/test'

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

export function mailbox(prefix: string, label: string): string {
    return `${prefix}-${label}@verti-grade.test`
}

export async function waitForMail(
    page: Page | APIRequestContext,
    to: string,
    options: {
        subject?: RegExp
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

export async function mailCount(
    page: Page | APIRequestContext,
    to: string,
): Promise<number> {
    const res = await api(page).get(
        `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    )
    return ((await res.json()).messages ?? []).length
}

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

export async function clearMailbox(page: Page | APIRequestContext) {
    await api(page).delete(`${MAILPIT}/api/v1/messages`)
}
