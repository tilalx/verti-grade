import { describe, it, expect, vi, beforeEach } from 'vitest'
import { h } from 'vue'
import { useNotification } from '~/composables/useNotification'

const add = vi.fn()

beforeEach(() => {
    add.mockClear()
    vi.stubGlobal('useToast', () => ({ add }))
    vi.stubGlobal('h', h)
})

describe('useNotification', () => {
    it('shows a coloured toast with a matching icon in the browser', () => {
        process.server = false
        useNotification().error('Nope')
        expect(add).toHaveBeenCalledWith(
            expect.objectContaining({
                color: 'error',
                icon: 'i-lucide-circle-alert',
                'data-testid': 'global-snackbar',
            }),
        )
    })

    it('skips toasts during server rendering so the payload stays serialisable', () => {
        process.server = true
        useNotification().success('Saved')
        expect(add).not.toHaveBeenCalled()
    })
})
