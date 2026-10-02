import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { useThemeMode } from '~/composables/useThemeMode'

const colorMode = reactive({ preference: 'system', value: 'light' })

class FakeChannel {
    static instances: FakeChannel[] = []
    listeners: ((event: MessageEvent) => void)[] = []
    posted: unknown[] = []
    constructor() {
        FakeChannel.instances.push(this)
    }
    postMessage(data: unknown) {
        this.posted.push(data)
    }
    addEventListener(_: string, listener: (event: MessageEvent) => void) {
        this.listeners.push(listener)
    }
    removeEventListener(_: string, listener: (event: MessageEvent) => void) {
        this.listeners = this.listeners.filter((entry) => entry !== listener)
    }
    receive(data: unknown) {
        this.listeners.forEach((listener) => listener({ data } as MessageEvent))
    }
}

beforeEach(() => {
    colorMode.preference = 'system'
    colorMode.value = 'light'
    vi.stubGlobal('useColorMode', () => colorMode)
    vi.stubGlobal('BroadcastChannel', FakeChannel)
    vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({ matches: false })),
    )
    window.matchMedia = globalThis.matchMedia
})

describe('useThemeMode', () => {
    it('shares the chosen mode between callers', async () => {
        const first = useThemeMode()
        const second = useThemeMode()
        await first.setMode('light')
        expect(second.mode.value).toBe('light')
        await first.setMode('dark')
        expect(second.mode.value).toBe('dark')
        expect(colorMode.preference).toBe('dark')
    })

    it('broadcasts explicit choices to other tabs', async () => {
        await useThemeMode().setMode('dark')
        expect(FakeChannel.instances[0]!.posted).toContain('dark')
    })

    it('adopts modes broadcast by other tabs until cleanup', async () => {
        const stop = useThemeMode().listenForThemeChanges()
        FakeChannel.instances[0]!.receive('dark')
        expect(colorMode.preference).toBe('dark')
        stop()
        FakeChannel.instances[0]!.receive('light')
        expect(colorMode.preference).toBe('dark')
    })

    it('ignores unknown broadcast payloads', () => {
        const stop = useThemeMode().listenForThemeChanges()
        FakeChannel.instances[0]!.receive('purple')
        expect(colorMode.preference).toBe('system')
        stop()
    })

    it('falls back to system for an unknown stored preference', () => {
        colorMode.preference = 'sepia'
        expect(useThemeMode().mode.value).toBe('system')
    })
})
