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

export async function fetchAuditRowsAnonymously(page: Page) {
    const res = await page.request.get(
        '/api/collections/audit_logs/records?perPage=200',
    )
    return await res.json()
}

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
