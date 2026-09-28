import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useThemeMode } from '~/composables/useThemeMode'

type Listener = (event: { matches: boolean }) => void

let systemDark = false
let schemeListeners: Listener[] = []
const themeName = ref('light')
const change = vi.fn((name: string) => (themeName.value = name))

beforeEach(() => {
    systemDark = false
    schemeListeners = []
    themeName.value = 'light'
    change.mockClear()
    vi.stubGlobal('useTheme', () => ({ name: themeName, change }))
    vi.stubGlobal('useCookie', () => ref('system'))
    vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({
            matches: query.includes('dark') ? systemDark : false,
            addEventListener: (_: string, listener: Listener) =>
                schemeListeners.push(listener),
            removeEventListener: (_: string, listener: Listener) =>
                (schemeListeners = schemeListeners.filter(
                    (entry) => entry !== listener,
                )),
        })),
    )
    window.matchMedia = globalThis.matchMedia
})

const flipSystem = (dark: boolean) => {
    systemDark = dark
    schemeListeners.forEach((listener) => listener({ matches: dark }))
}

describe('useThemeMode', () => {
    it('follows OS appearance changes in system mode', () => {
        const { listenForThemeChanges } = useThemeMode()
        const stop = listenForThemeChanges()
        flipSystem(true)
        expect(change).toHaveBeenLastCalledWith('dark')
        flipSystem(false)
        expect(change).toHaveBeenLastCalledWith('light')
        stop()
    })

    it('ignores OS appearance changes after an explicit choice', async () => {
        const { setMode, listenForThemeChanges } = useThemeMode()
        await setMode('light')
        const stop = listenForThemeChanges()
        change.mockClear()
        flipSystem(true)
        expect(change).not.toHaveBeenCalled()
        stop()
    })

    it('stops listening after cleanup', () => {
        const { listenForThemeChanges } = useThemeMode()
        listenForThemeChanges()()
        flipSystem(true)
        expect(change).not.toHaveBeenCalled()
    })

    it('cycles system, light, dark and shares the mode between callers', async () => {
        const first = useThemeMode()
        const second = useThemeMode()
        await first.cycleMode()
        expect(second.mode.value).toBe('light')
        await first.cycleMode()
        expect(second.mode.value).toBe('dark')
        expect(change).toHaveBeenLastCalledWith('dark')
    })
})
