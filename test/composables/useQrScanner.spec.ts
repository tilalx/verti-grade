import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useQrScanner } from '~/composables/useQrScanner'

function mountScanner() {
    let scanner!: ReturnType<typeof useQrScanner>
    const wrapper = mount(
        defineComponent({
            setup() {
                scanner = useQrScanner(ref(null), () => 'camera-error')
                return () => h('div')
            },
        }),
    )
    return { wrapper, scanner }
}

describe('useQrScanner', () => {
    it('starts and stops the camera', () => {
        const { scanner } = mountScanner()
        scanner.start()
        expect(scanner.cameraActive.value).toBe(true)

        scanner.onCameraOn({ torch: true } as MediaTrackCapabilities)
        expect(scanner.scanning.value).toBe(true)
        expect(scanner.torchSupported.value).toBe(true)

        scanner.stop()
        expect(scanner.cameraActive.value).toBe(false)
        expect(scanner.scanning.value).toBe(false)
        expect(scanner.torchSupported.value).toBe(false)
    })

    it('never shows raw browser error text', () => {
        const { scanner } = mountScanner()
        scanner.start()
        scanner.onCameraError({ name: 'NotAllowedError', message: 'denied' })
        expect(scanner.cameraActive.value).toBe(false)
        expect(scanner.scannerError.value).toBe('camera-error')

        scanner.onCameraError({ name: 'Other', message: 'boom' })
        expect(scanner.scannerError.value).toBe('camera-error')
    })

    it('stops when the page is hidden', () => {
        const { scanner } = mountScanner()
        scanner.start()
        Object.defineProperty(document, 'visibilityState', {
            value: 'hidden',
            configurable: true,
        })
        document.dispatchEvent(new Event('visibilitychange'))
        expect(scanner.cameraActive.value).toBe(false)
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            configurable: true,
        })
    })
})
