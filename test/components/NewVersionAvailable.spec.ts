import { beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import NewVersionAvailable from '~/components/notifications/newVersionAvailable.vue'

const DISMISS_KEY = 'verti-grade:update-dismissed'

const alertStub = {
    props: ['closable', 'closeLabel'],
    emits: ['click:close'],
    template:
        '<div class="v-alert"><slot /><button class="close" @click="$emit(\'click:close\')" /></div>',
}
const dialogStub = {
    template: '<div><slot name="activator" :props="{}" /></div>',
}

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
    mode: 'release',
    updateAvailable: true,
    error: null,
    ...overrides,
})

function createWrapper() {
    return mount(NewVersionAvailable, {
        global: {
            stubs: {
                'v-alert': alertStub,
                'v-btn': { template: '<button><slot /></button>' },
                NotificationsReleaseNotesDialog: dialogStub,
                NotificationsCommitListDialog: dialogStub,
            },
            mocks: {
                $t: (key: string, params?: unknown) =>
                    params === undefined ? key : `${key}:${params}`,
            },
        },
    })
}

describe('newVersionAvailable banner', () => {
    beforeEach(() => {
        globalThis.__NUXT_RUNTIME_CONFIG__ = { public: { appVersion: '1.9.0' } }
        localStorage.clear()
    })

    it('stays hidden when no update is available', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({ mode: 'none', updateAvailable: false, latest: null }),
        )

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(
            false,
        )
    })

    it('stays hidden while the check is still in flight', () => {
        globalThis.$fetch.mockResolvedValue(payload())

        expect(
            createWrapper().find('[data-testid="update-banner"]').exists(),
        ).toBe(false)
    })

    it('announces a newer release with a changelog link', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(
            true,
        )
        expect(wrapper.text()).toContain('v1.10.0')
        expect(
            wrapper.find('[data-testid="update-banner-changelog"]').exists(),
        ).toBe(true)
    })

    it('announces new commits with a pluralised count', async () => {
        globalThis.$fetch.mockResolvedValue(
            payload({
                mode: 'commit',
                latest: null,
                commits: [
                    { sha: 'bbbbbbb', message: 'second', date: null },
                    { sha: 'aaaaaaa', message: 'first', date: null },
                ],
            }),
        )

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.text()).toContain(
            'notifications.updateBanner.commitsMessage:2',
        )
        expect(
            wrapper.find('[data-testid="update-banner-commits"]').exists(),
        ).toBe(true)
    })

    it('persists a dismissal so it survives a reload', async () => {
        globalThis.$fetch.mockResolvedValue(payload())

        const wrapper = createWrapper()
        await flushPromises()
        await wrapper.find('.close').trigger('click')

        expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(
            false,
        )
        expect(localStorage.getItem(DISMISS_KEY)).toBe('v1.10.0')
    })

    it('stays dismissed on remount for the same update', async () => {
        localStorage.setItem(DISMISS_KEY, 'v1.10.0')
        globalThis.$fetch.mockResolvedValue(payload())

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(
            false,
        )
    })

    it('reappears for a newer update than the dismissed one', async () => {
        localStorage.setItem(DISMISS_KEY, 'v1.10.0')
        globalThis.$fetch.mockResolvedValue(
            payload({
                latest: { tag: 'v1.11.0', notes: null, publishedAt: null },
            }),
        )

        const wrapper = createWrapper()
        await flushPromises()

        expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(
            true,
        )
    })
})
