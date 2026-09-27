import { computed } from 'vue'
import { mount } from '@vue/test-utils'
import DesktopHint from '~/components/layout/DesktopHint.vue'

const alertStub = { template: '<div role="alert"><slot /></div>' }

function createWrapper(mdAndUp: boolean, slots: Record<string, string> = {}) {
    vi.stubGlobal('useDisplay', () => ({ mdAndUp: computed(() => mdAndUp) }))
    return mount(DesktopHint, {
        slots,
        global: {
            mocks: { $t: (key: string) => key },
            stubs: { 'v-alert': alertStub },
        },
    })
}

describe('DesktopHint', () => {
    it('shows the default hint below md', () => {
        const wrapper = createWrapper(false)

        expect(wrapper.text()).toBe('nav.desktopHint')
    })

    it('renders slot content instead of the default text', () => {
        const wrapper = createWrapper(false, { default: 'Use a tablet' })

        expect(wrapper.text()).toBe('Use a tablet')
    })

    it('renders nothing from md upwards', () => {
        const wrapper = createWrapper(true)

        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
})
