import { mount } from '@vue/test-utils'
import ColorDot from '~/components/route/ColorDot.vue'

function createWrapper(props: Record<string, unknown> = {}) {
    return mount(ColorDot, {
        props,
        global: { mocks: { $t: (key: string) => key } },
    })
}

describe('RouteColorDot', () => {
    it('renders a plain sized dot in the route color', () => {
        const wrapper = createWrapper({ color: '#e53935', size: 26 })
        const style = wrapper.attributes('style')

        expect(wrapper.element.tagName).toBe('SPAN')
        expect(wrapper.attributes('data-testid')).toBe('route-color-dot')
        expect(style).toContain('width: 26px')
        expect(style).toContain('height: 26px')
        expect(style).toMatch(/background: (#E53935|rgb\(229, 57, 53\))/)
        expect(wrapper.find('.route-color-dot__tick').exists()).toBe(false)
        expect(wrapper.attributes('role')).toBe('img')
        expect(wrapper.attributes('aria-label')).toBe('colors.red')
    })

    it('falls back to grey without a usable color', () => {
        const wrapper = createWrapper({ color: null })

        expect(wrapper.attributes('style')).toMatch(
            /background: (#9E9E9E|rgb\(158, 158, 158\))/,
        )
        expect(wrapper.attributes('role')).toBeUndefined()
    })

    it('marks sent routes with an accessible tick', () => {
        const wrapper = createWrapper({ color: '#e53935', ticked: true })

        expect(wrapper.find('.route-color-dot__tick').exists()).toBe(true)
        expect(wrapper.attributes('role')).toBe('img')
        expect(wrapper.attributes('aria-label')).toBe('colors.red, ticks.sent')
        expect(wrapper.attributes('data-ticked')).toBe('true')
    })
})
