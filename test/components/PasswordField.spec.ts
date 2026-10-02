import { mount } from '@vue/test-utils'
import PasswordField from '~/components/user/PasswordField.vue'

const formFieldStub = { template: '<div><slot /></div>' }
const inputStub = {
    props: ['modelValue', 'type', 'autocomplete'],
    template:
        '<div><input :type="type" :value="modelValue" :autocomplete="autocomplete" /><slot name="trailing" /></div>',
}
const buttonStub = {
    props: ['icon'],
    template: '<button type="button" :data-icon="icon"><slot /></button>',
}

function createWrapper(props: Record<string, unknown> = {}) {
    return mount(PasswordField, {
        props: { label: 'Password', modelValue: 'secret', ...props },
        global: {
            mocks: { $t: (key: string) => key },
            stubs: {
                UFormField: formFieldStub,
                UInput: inputStub,
                UButton: buttonStub,
            },
        },
    })
}

describe('PasswordField', () => {
    it('hides the password and labels the toggle for showing it', () => {
        const wrapper = createWrapper()
        const toggle = wrapper.find('[data-testid="password-toggle"]')

        expect(wrapper.find('input').attributes('type')).toBe('password')
        expect(wrapper.find('input').attributes('autocomplete')).toBe(
            'current-password',
        )
        expect(toggle.attributes('aria-label')).toBe('account.showPassword')
        expect(toggle.attributes('data-icon')).toBe('i-lucide-eye')
    })

    it('reveals the password when the toggle is clicked', async () => {
        const wrapper = createWrapper()

        await wrapper.find('[data-testid="password-toggle"]').trigger('click')

        const toggle = wrapper.find('[data-testid="password-toggle"]')
        expect(wrapper.find('input').attributes('type')).toBe('text')
        expect(toggle.attributes('aria-label')).toBe('account.hidePassword')
        expect(toggle.attributes('data-icon')).toBe('i-lucide-eye-off')
    })

    it('renders the toggle as a native button for keyboard access', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.find('[data-testid="password-toggle"]').element.tagName,
        ).toBe('BUTTON')
    })

    it('omits the toggle when hideToggle is set', () => {
        const wrapper = createWrapper({ hideToggle: true })

        expect(wrapper.find('[data-testid="password-toggle"]').exists()).toBe(
            false,
        )
    })

    it('passes autocomplete through', () => {
        const wrapper = createWrapper({ autocomplete: 'new-password' })

        expect(wrapper.find('input').attributes('autocomplete')).toBe(
            'new-password',
        )
    })
})
