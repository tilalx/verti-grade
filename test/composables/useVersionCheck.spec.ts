import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { useVersionCheck } from '~/composables/useVersionCheck'

const payload = (overrides = {}) => ({
    installed: {
        raw: '1.9.0',
        base: '1.9.0',
        ahead: 0,
        sha: null,
        notes: 'installed notes',
    },
    latest: {
        tag: 'v1.10.0',
        notes: 'latest notes',
        publishedAt: '2026-01-01',
    },
    commits: [],
    mode: 'release',
    updateAvailable: true,
    error: null,
    ...overrides,
})

describe('useVersionCheck', () => {
    beforeEach(() => {
        globalThis.__NUXT_RUNTIME_CONFIG__ = { public: { appVersion: '1.9.0' } }
    })

    it('requests the cached server endpoint, never GitHub directly', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        useVersionCheck()
        await flushPromises()

        expect(globalThis.$fetch).toHaveBeenCalledWith('/api/version')
        expect(globalThis.$fetch).toHaveBeenCalledTimes(1)
    })

    it('exposes appVersion synchronously so the footer does not wait on the fetch', () => {
        globalThis.$fetch.mockResolvedValue(payload())

        // Read before flushing: the value must already be there.
        expect(useVersionCheck().appVersion).toBe('1.9.0')
    })

    it('surfaces release-mode state', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const { mode, updateAvailable, latest, updateId } = useVersionCheck()
        await flushPromises()

        expect(mode.value).toBe('release')
        expect(updateAvailable.value).toBe(true)
        expect(latest.value?.tag).toBe('v1.10.0')
        expect(updateId.value).toBe('v1.10.0')
    })

    it('surfaces commit-mode state and keys the update on the newest sha', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({
                mode: 'commit',
                latest: null,
                commits: [
                    { sha: 'bbbbbbb', message: 'second', date: '2026-01-02' },
                    { sha: 'aaaaaaa', message: 'first', date: '2026-01-01' },
                ],
            }),
        )

        const { mode, commits, updateId } = useVersionCheck()
        await flushPromises()

        expect(mode.value).toBe('commit')
        expect(commits.value).toHaveLength(2)
        expect(updateId.value).toBe('bbbbbbb')
    })

    it('degrades to a quiet no-update state when the endpoint fails', async () => {
        globalThis.$fetch.mockRejectedValue(new Error('network'))

        const { mode, updateAvailable, commits, latest } = useVersionCheck()
        await flushPromises()

        expect(mode.value).toBe('none')
        expect(updateAvailable.value).toBe(false)
        expect(latest.value).toBeNull()
        expect(commits.value).toEqual([])
    })

    it('surfaces a rate-limit error so dialogs can distinguish it from empty notes', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({
                error: 'rate_limited',
                latest: null,
                updateAvailable: false,
            }),
        )

        const { error } = useVersionCheck()
        await flushPromises()

        expect(error.value).toBe('rate_limited')
    })

    it('exposes the installed release notes for the footer dialog', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const { installedNotes, installedBase } = useVersionCheck()
        await flushPromises()

        expect(installedNotes.value).toBe('installed notes')
        expect(installedBase.value).toBe('1.9.0')
    })
})
