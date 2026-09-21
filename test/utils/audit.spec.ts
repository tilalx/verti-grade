import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    AUDIT_ACTIONS,
    actionColor,
    auditTargetUrl,
    buildAuditFilter,
    isSuperuserEntry,
    pbDateString,
} from '~/utils/audit'

// ---------------------------------------------------------------------------
// buildAuditFilter — hand-built PocketBase filter strings
// ---------------------------------------------------------------------------

describe('buildAuditFilter', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns an empty string when nothing is filtered', () => {
        expect(buildAuditFilter({})).toBe('')
        expect(buildAuditFilter({ search: '   ', period: 'all' })).toBe('')
    })

    it('filters by a single action', () => {
        expect(buildAuditFilter({ action: 'delete' })).toBe('action = "delete"')
    })

    it('scopes to one actor', () => {
        expect(buildAuditFilter({ actorId: 'usr123' })).toBe('actor = "usr123"')
    })

    // A search term reaches the filter string unquoted, so a stray double
    // quote would end the literal and the rest would parse as filter syntax.
    it('escapes backslashes and double quotes in the search term', () => {
        const filter = buildAuditFilter({ search: 'a"b\\c' })
        expect(filter).toContain('actor_label ~ "a\\"b\\\\c"')
        expect(filter.startsWith('(')).toBe(true)
    })

    it('turns a period into a created cutoff', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))
        expect(buildAuditFilter({ period: '24h' })).toBe(
            'created >= "2026-09-20 12:00:00.000Z"',
        )
        expect(buildAuditFilter({ period: '7d' })).toBe(
            'created >= "2026-09-14 12:00:00.000Z"',
        )
    })

    it('emits no cutoff for the all-time period', () => {
        expect(buildAuditFilter({ period: 'all' })).toBe('')
    })

    it('joins several filters with &&', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))
        expect(
            buildAuditFilter({
                action: 'update',
                collection: 'routes',
                period: '24h',
            }),
        ).toBe(
            'action = "update" && collection_name = "routes" && created >= "2026-09-20 12:00:00.000Z"',
        )
    })
})

// ---------------------------------------------------------------------------
// pbDateString — must match how PocketBase stores dates, or comparisons lie
// ---------------------------------------------------------------------------

describe('pbDateString', () => {
    it('formats as PocketBase stores dates', () => {
        expect(pbDateString(new Date('2026-06-23T06:28:16.309Z'))).toBe(
            '2026-06-23 06:28:16.309Z',
        )
    })
})

// ---------------------------------------------------------------------------
// actionColor
// ---------------------------------------------------------------------------

describe('actionColor', () => {
    it('gives the destructive and failed actions their own colours', () => {
        expect(actionColor('delete')).toBe('error')
        expect(actionColor('login_failed')).toBe('warning')
        expect(actionColor('create')).toBe('success')
    })

    it('degrades to a neutral colour for an unknown action', () => {
        expect(actionColor('something-else')).toBe('medium-emphasis')
    })

    // Catches an action added to the select without a colour to render it.
    it('returns a colour for every action in the list', () => {
        for (const action of AUDIT_ACTIONS) {
            expect(actionColor(action)).toBeTruthy()
        }
    })
})

// ---------------------------------------------------------------------------
// AUDIT_ACTIONS — must mirror the PocketBase select field
// ---------------------------------------------------------------------------

describe('AUDIT_ACTIONS', () => {
    it('has no duplicates', () => {
        expect(new Set(AUDIT_ACTIONS).size).toBe(AUDIT_ACTIONS.length)
    })

    it('matches the values the PocketBase select accepts', () => {
        expect([...AUDIT_ACTIONS].sort()).toEqual(
            [
                'create',
                'update',
                'delete',
                'login',
                'login_failed',
                'password_reset_request',
                'password_reset',
                'email_change_request',
                'email_change',
            ].sort(),
        )
    })
})

// ---------------------------------------------------------------------------
// auditTargetUrl — entries outlive their records, so this is best-effort
// ---------------------------------------------------------------------------

describe('auditTargetUrl', () => {
    it('links a route entry to its page', () => {
        expect(auditTargetUrl('routes', 'rt1')).toBe('/route?id=rt1')
    })

    it('returns null when there is nowhere to go', () => {
        expect(auditTargetUrl('roles', 'r1')).toBeNull()
        expect(auditTargetUrl('routes', null)).toBeNull()
        expect(auditTargetUrl(null, 'rt1')).toBeNull()
    })
})

describe('isSuperuserEntry', () => {
    it('recognises a superuser entry by its label', () => {
        expect(isSuperuserEntry({ actor_label: 'superuser:a@b.test' })).toBe(
            true,
        )
        expect(isSuperuserEntry({ actor_label: 'a@b.test' })).toBe(false)
        expect(isSuperuserEntry({ actor_label: null })).toBe(false)
    })
})
