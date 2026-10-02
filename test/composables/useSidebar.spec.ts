import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref, type Ref } from 'vue'
import { useSidebar } from '~/composables/useSidebar'

const width = ref(0)
let cookie: Ref<boolean | undefined>
let states: Record<string, Ref<unknown>>

beforeEach(() => {
    width.value = 0
    cookie = ref(undefined)
    states = {}
    vi.stubGlobal('computed', computed)
    vi.stubGlobal('useCookie', () => cookie)
    vi.stubGlobal(
        'useState',
        (key: string, init: () => unknown) => (states[key] ??= ref(init())),
    )
    vi.stubGlobal('useDisplay', () => ({ width }))
})

describe('useSidebar', () => {
    it('is expanded while the viewport width is still unknown', () => {
        expect(useSidebar().open.value).toBe(true)
    })

    it('collapses to the icon rail on narrow laptops', () => {
        width.value = 1160
        expect(useSidebar().open.value).toBe(false)
        width.value = 1440
        expect(useSidebar().open.value).toBe(true)
    })

    it('keeps the user choice and stores it in the cookie', () => {
        width.value = 1440
        const sidebar = useSidebar()
        sidebar.toggle()
        expect(sidebar.open.value).toBe(false)
        expect(cookie.value).toBe(false)
        width.value = 2000
        expect(useSidebar().open.value).toBe(false)
    })

    it('restores a stored choice', () => {
        cookie.value = true
        width.value = 1160
        expect(useSidebar().open.value).toBe(true)
    })
})
