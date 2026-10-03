import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import UpdatePill from '~/components/notifications/UpdatePill.vue'

const dialogStub = (name: string) => ({
    props: ['tag', 'commits'],
    template: `<div data-dialog="${name}" :data-tag="tag"><slot name="activator" :props="{}" /></div>`,
})

const payload = (overrides = {}) => ({
    installed: {
        raw: '1.9.0',
        base: '1.9.0',
        ahead: 0,
        sha: null,
        notes: null,
    },
    latest: { tag: 'v1.10.0', notes: 'notes', publishedAt: '2026-01-01' },
    commits: [],
    installedCommits: [],
    mode: 'release',
    updateAvailable: true,
    error: null,
    ...overrides,
})

function createWrapper({ admin = true } = {}) {
    vi.stubGlobal('usePermissions', () => ({
        can: (permission: string) => admin && permission === 'manage_settings',
    }))
    return mount(UpdatePill, {
        slots: { default: '<button data-testid="pill">update</button>' },
        global: {
            stubs: {
                NotificationsReleaseNotesDialog: dialogStub('release'),
                NotificationsCommitListDialog: dialogStub('commits'),
            },
        },
    })
}

describe('UpdatePill', () => {
    beforeEach(() => {
        globalThis.__NUXT_RUNTIME_CONFIG__ = { public: { appVersion: '1.9.0' } }
    })

    it('stays hidden when no update is available', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({ mode: 'none', updateAvailable: false, latest: null }),
        )

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.find('[data-testid="pill"]').exists()).toBe(false)
    })

    it('stays hidden while the check is still in flight', () => {
        globalThis.$fetch.mockResolvedValue(payload())

        expect(createWrapper().find('[data-testid="pill"]').exists()).toBe(
            false,
        )
    })

    it('stays hidden for users without manage_settings', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const wrapper = createWrapper({ admin: false })
        await flushPromises()

        expect(wrapper.find('[data-testid="pill"]').exists()).toBe(false)
    })

    it('opens the release notes of a newer release', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const wrapper = createWrapper()
        await flushPromises()

        const dialog = wrapper.find('[data-dialog="release"]')
        expect(dialog.attributes('data-tag')).toBe('v1.10.0')
        expect(dialog.find('[data-testid="pill"]').exists()).toBe(true)
    })

    it('lists new commits when ahead of the release', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({
                mode: 'commit',
                latest: null,
                commits: [{ sha: 'bbbbbbb', message: 'second', date: null }],
            }),
        )

        const wrapper = createWrapper()
        await flushPromises()

        expect(
            wrapper
                .find('[data-dialog="commits"]')
                .find('[data-testid="pill"]')
                .exists(),
        ).toBe(true)
    })
})
