import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentScope, onScopeDispose } from 'vue'
import { useDisplay } from '~/composables/useDisplay'

const setHeader = vi.fn()
let hintedWidth: string | undefined

beforeEach(() => {
    process.server = true
    setHeader.mockClear()
    hintedWidth = undefined
    vi.stubGlobal('useRequestEvent', () => ({ node: { res: { setHeader } } }))
    vi.stubGlobal('useRequestHeader', () => hintedWidth)
    vi.stubGlobal('getCurrentScope', getCurrentScope)
    vi.stubGlobal('onScopeDispose', onScopeDispose)
})

describe('useDisplay', () => {
    it('asks the browser for the viewport width hint', () => {
        useDisplay()
        expect(setHeader).toHaveBeenCalledWith(
            'Accept-CH',
            'Sec-CH-Viewport-Width',
        )
    })

    it('renders the phone layout without a viewport hint', () => {
        const display = useDisplay()
        expect(display.xs.value).toBe(true)
        expect(display.smAndUp.value).toBe(false)
        expect(display.lgAndUp.value).toBe(false)
    })

    it('uses the Vuetify 4 breakpoints for a hinted width', () => {
        hintedWidth = '1200'
        const display = useDisplay()
        expect(display.width.value).toBe(1200)
        expect(display.smAndDown.value).toBe(false)
        expect(display.mdAndUp.value).toBe(true)
        expect(display.mdAndDown.value).toBe(false)
        expect(display.lgAndUp.value).toBe(true)
        expect(display.xlAndUp.value).toBe(false)
    })

    it('treats 840px as the start of md', () => {
        hintedWidth = '839'
        expect(useDisplay().smAndDown.value).toBe(true)
    })

    it('switches to the real window width once hydration finishes', () => {
        process.server = false
        let ready = () => {}
        vi.stubGlobal('useNuxtApp', () => ({
            isHydrating: true,
            hooks: {
                hookOnce: (name: string, callback: () => void) => {
                    if (name === 'app:suspense:resolve') ready = callback
                },
            },
        }))
        window.innerWidth = 1600
        const display = useDisplay()
        expect(display.width.value).toBe(0)
        ready()
        expect(display.xlAndUp.value).toBe(true)
        window.innerWidth = 700
        window.dispatchEvent(new Event('resize'))
        expect(display.smAndDown.value).toBe(true)
        expect(display.smAndUp.value).toBe(true)
    })

    it('reads the window width right away after hydration', () => {
        process.server = false
        vi.stubGlobal('useNuxtApp', () => ({ isHydrating: false }))
        window.innerWidth = 1200
        expect(useDisplay().lgAndUp.value).toBe(true)
    })
})
