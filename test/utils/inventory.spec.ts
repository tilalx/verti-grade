/**
 * Tests for pure utility logic from app/pages/admin/inventory.vue.
 *
 * loadStoredScannedIds and persistScannedIds interact with localStorage.
 * The logic is inlined here because these functions are defined inside a
 * Vue SFC <script setup> block and cannot be imported directly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const STORAGE_KEY = 'verti-grade:scanned-route-ids'

// ---------------------------------------------------------------------------
// Helpers that mirror the inventory page implementation
// ---------------------------------------------------------------------------

function loadStoredScannedIds(): string[] {
    if (!process.client) return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((value) => typeof value === 'string' && value.length > 0)
    } catch {
        return []
    }
}

function persistScannedIds(ids: string[]): void {
    if (!process.client) return
    try {
        if (Array.isArray(ids) && ids.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    } catch {
        // swallow
    }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
    process.client = true
    localStorage.clear()
})

// ---------------------------------------------------------------------------
// loadStoredScannedIds
// ---------------------------------------------------------------------------

describe('loadStoredScannedIds', () => {
    it('returns [] when nothing is stored', () => {
        expect(loadStoredScannedIds()).toEqual([])
    })

    it('returns the stored string ids', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(['abc', 'def']))
        expect(loadStoredScannedIds()).toEqual(['abc', 'def'])
    })

    it('filters out non-string values', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(['abc', 42, null, 'def']))
        expect(loadStoredScannedIds()).toEqual(['abc', 'def'])
    })

    it('filters out empty strings', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(['abc', '', 'def']))
        expect(loadStoredScannedIds()).toEqual(['abc', 'def'])
    })

    it('returns [] when stored value is not a JSON array', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }))
        expect(loadStoredScannedIds()).toEqual([])
    })

    it('returns [] when stored value is invalid JSON', () => {
        localStorage.setItem(STORAGE_KEY, 'not-valid-json')
        expect(loadStoredScannedIds()).toEqual([])
    })

    it('returns [] on the server (process.client = false)', () => {
        process.client = false
        expect(loadStoredScannedIds()).toEqual([])
    })
})

// ---------------------------------------------------------------------------
// persistScannedIds
// ---------------------------------------------------------------------------

describe('persistScannedIds', () => {
    it('writes the ids to localStorage', () => {
        persistScannedIds(['abc', 'def'])
        expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(['abc', 'def'])
    })

    it('removes the key for an empty array', () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(['abc']))
        persistScannedIds([])
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does nothing when process.client is false', () => {
        process.client = false
        persistScannedIds(['abc'])
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    })
})
