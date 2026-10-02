import { mount } from '@vue/test-utils'
import EmptyState from '~/components/layout/EmptyState.vue'

const iconStub = { props: ['name'], template: '<i :data-icon="name" />' }

function createWrapper(
    props: Record<string, unknown> = {},
    slots: Record<string, string> = {},
) {
    return mount(EmptyState, {
        props: { title: 'Nothing here', ...props },
        slots,
        global: { stubs: { UIcon: iconStub } },
    })
}

describe('EmptyState', () => {
    it('renders the empty variant without an alert role', () => {
        const wrapper = createWrapper()

        expect(wrapper.attributes('role')).toBeUndefined()
        expect(wrapper.find('i').attributes('data-icon')).toBe(
            'i-lucide-search-x',
        )
        expect(wrapper.find('.empty-state__icon--error').exists()).toBe(false)
    })

    it('renders the error variant as an alert with an error icon', () => {
        const wrapper = createWrapper({ variant: 'error' })

        expect(wrapper.attributes('role')).toBe('alert')
        expect(wrapper.find('i').attributes('data-icon')).toBe(
            'i-lucide-circle-alert',
        )
        expect(wrapper.find('.empty-state__icon--error').exists()).toBe(true)
    })

    it('keeps an explicit icon in the error variant', () => {
        const wrapper = createWrapper({
            variant: 'error',
            icon: 'i-lucide-wifi-off',
        })

        expect(wrapper.find('i').attributes('data-icon')).toBe(
            'i-lucide-wifi-off',
        )
    })

    it('renders the actions slot only when provided', () => {
        expect(createWrapper().find('button').exists()).toBe(false)

        const wrapper = createWrapper(
            {},
            { actions: '<button data-testid="retry">Retry</button>' },
        )
        expect(wrapper.find('[data-testid="retry"]').text()).toBe('Retry')
    })
})
