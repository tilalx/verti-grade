import { describe, it, expect } from 'vitest'
import { reportContentUrl, statusColor, REPORT_REASONS } from '~/utils/reports'

// ---------------------------------------------------------------------------
// reportContentUrl — DSA Art. 16(2)(b) "exact electronic location"
// ---------------------------------------------------------------------------

describe('reportContentUrl', () => {
    it('addresses a comment as an anchor on its route page', () => {
        expect(reportContentUrl('rating', 'cmt123', 'rt456')).toBe(
            '/route?id=rt456#comment-cmt123',
        )
    })

    it('addresses a route by its own page, ignoring any route id passed', () => {
        expect(reportContentUrl('route', 'rt456', 'rt999')).toBe('/route?id=rt456')
    })

    // A comment can be reported before the route id is known (or if it is
    // missing); the anchor alone still identifies the item on the current page.
    it('falls back to a bare anchor when the route id is missing', () => {
        expect(reportContentUrl('rating', 'cmt123', null)).toBe('#comment-cmt123')
        expect(reportContentUrl('rating', 'cmt123')).toBe('#comment-cmt123')
    })
})

// ---------------------------------------------------------------------------
// statusColor
// ---------------------------------------------------------------------------

describe('statusColor', () => {
    it('maps each status to its own colour', () => {
        expect(statusColor('open')).toBe('warning')
        expect(statusColor('actioned')).toBe('success')
        expect(statusColor('rejected')).toBe('medium-emphasis')
    })

    it('degrades to a neutral colour for an unknown status', () => {
        expect(statusColor('something-else')).toBe('medium-emphasis')
    })
})

// ---------------------------------------------------------------------------
// REPORT_REASONS
// ---------------------------------------------------------------------------

describe('REPORT_REASONS', () => {
    // These must stay in lockstep with the PocketBase select field, which
    // rejects any value outside its own list.
    it('matches the reason values the reports collection accepts', () => {
        expect(REPORT_REASONS).toEqual([
            'hate_speech',
            'harassment',
            'violence_threat',
            'sexual_content',
            'personal_data',
            'ip_infringement',
            'spam_fraud',
            'other',
        ])
    })

    it('has no duplicates', () => {
        expect(new Set(REPORT_REASONS).size).toBe(REPORT_REASONS.length)
    })
})
