import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAsyncAction } from '~/composables/useAsyncAction'

const notifySuccess = vi.fn()
const notifyError = vi.fn()
vi.stubGlobal('useNotification', () => ({
    success: notifySuccess,
    error: notifyError,
}))

beforeEach(() => {
    notifySuccess.mockReset()
    notifyError.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('useAsyncAction', () => {
    it('returns the result, toggles pending and notifies success', async () => {
        const { pending, run } = useAsyncAction()
        const running = run(async () => 42, { success: 'saved' })
        expect(pending.value).toBe(true)
        expect(await running).toBe(42)
        expect(pending.value).toBe(false)
        expect(notifySuccess).toHaveBeenCalledWith('saved')
        expect(notifyError).not.toHaveBeenCalled()
    })

    it('notifies the generic error by default', async () => {
        const { pending, run } = useAsyncAction()
        const result = await run(() => Promise.reject(new Error('boom')), {
            success: 'saved',
        })
        expect(result).toBeUndefined()
        expect(pending.value).toBe(false)
        expect(notifySuccess).not.toHaveBeenCalled()
        expect(notifyError).toHaveBeenCalledWith('notifications.error.generic')
    })

    it('uses a custom error message or resolver', async () => {
        const { run } = useAsyncAction()
        await run(() => Promise.reject(new Error('x')), { error: 'custom' })
        expect(notifyError).toHaveBeenLastCalledWith('custom')

        await run(() => Promise.reject({ status: 400 }), {
            error: (error) =>
                (error as { status: number }).status === 400
                    ? 'in-use'
                    : 'other',
        })
        expect(notifyError).toHaveBeenLastCalledWith('in-use')
    })

    it('ignores abort errors', async () => {
        const { run } = useAsyncAction()
        const result = await run(() => Promise.reject({ isAbort: true }))
        expect(result).toBeUndefined()
        expect(notifyError).not.toHaveBeenCalled()
    })
})
