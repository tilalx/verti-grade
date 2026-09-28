import { expect, type APIRequestContext, type Page } from '@playwright/test'

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
    return `${prefix}-${label}@gripello.test`
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
    let found: MailMessage | undefined

    await expect
        .poll(
            async () => {
                const res = await request.get(
                    `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
                )
                if (!res.ok()) return []
                const items: MailSummary[] = (await res.json()).messages ?? []
                const candidates = options.subject
                    ? items.filter((item) =>
                          options.subject!.test(item.Subject),
                      )
                    : items

                for (const candidate of candidates) {
                    const message = await readMail(page, candidate.ID)
                    if (
                        !options.bodyIncludes ||
                        `${message.HTML || ''}${message.Text || ''}`.includes(
                            options.bodyIncludes,
                        )
                    ) {
                        found = message
                        return 'found'
                    }
                }
                return items.map((item) => item.Subject)
            },
            {
                message: `mail to ${to}${options.subject ? ` matching ${options.subject}` : ''}`,
                timeout: options.timeoutMs ?? 15_000,
            },
        )
        .toBe('found')

    return found!
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
