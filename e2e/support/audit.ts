import type { Page } from '@playwright/test'
import { authHeader } from './nav'

export interface AuditRow {
    id: string
    actor: string
    actor_label: string
    action: string
    collection_name: string
    record_id: string
    changed_fields: string[] | null
    ip: string
    created: string
}

/**
 * Reads the audit log as whoever `page` is signed in as.
 *
 * Ownership rule, same as createComment/createReport: with `fullyParallel`
 * sibling tests are writing to this table constantly, so never assert on
 * `.first()` — always filter by the record id the calling test just touched.
 */
export async function fetchAuditRows(
    page: Page,
    filter: string,
): Promise<AuditRow[]> {
    const res = await page.request.get(
        `/api/collections/audit_logs/records?perPage=200&sort=-created&filter=${encodeURIComponent(filter)}`,
        { headers: await authHeader(page) },
    )
    const body = await res.json()
    return (body.items ?? []) as AuditRow[]
}

/** Reads the audit log with no credentials at all. */
export async function fetchAuditRowsAnonymously(page: Page) {
    const res = await page.request.get(
        '/api/collections/audit_logs/records?perPage=200',
    )
    return await res.json()
}

/** Polls until an entry for `recordId` shows up, since the hook writes after the response. */
export async function waitForAuditRow(
    page: Page,
    filter: string,
    timeoutMs = 10000,
): Promise<AuditRow[]> {
    const deadline = Date.now() + timeoutMs
    let rows: AuditRow[] = []
    while (Date.now() < deadline) {
        rows = await fetchAuditRows(page, filter)
        if (rows.length) return rows
        await page.waitForTimeout(250)
    }
    return rows
}
