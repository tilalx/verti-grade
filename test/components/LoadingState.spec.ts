import { mount } from '@vue/test-utils'
import LoadingState from '~/components/layout/LoadingState.vue'

function createWrapper(props: Record<string, unknown> = {}) {
    return mount(LoadingState, {
        props,
        global: {
            stubs: { USkeleton: { template: '<div class="skeleton" />' } },
        },
    })
}

const rowCount = (wrapper: ReturnType<typeof createWrapper>) =>
    wrapper.findAll('.skeleton-row').length

describe('LoadingState', () => {
    it('announces itself as busy', () => {
        const wrapper = createWrapper()

        expect(wrapper.attributes('aria-busy')).toBe('true')
        expect(wrapper.attributes('aria-live')).toBe('polite')
    })

    it('renders three list rows by default', () => {
        expect(rowCount(createWrapper())).toBe(3)
    })

    it('renders six cards for the cards variant', () => {
        const wrapper = createWrapper({ variant: 'cards' })
        expect(rowCount(wrapper)).toBe(6)
        expect(wrapper.find('.grid').exists()).toBe(true)
    })

    it('honours a count override', () => {
        expect(rowCount(createWrapper({ count: 1 }))).toBe(1)
    })

    it('renders a hero, heading and list rows for the page variant', () => {
        const wrapper = createWrapper({ variant: 'page' })
        expect(rowCount(wrapper)).toBe(3)
        expect(wrapper.findAll('.skeleton').length).toBeGreaterThan(9)
    })
})
