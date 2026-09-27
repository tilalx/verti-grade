import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { usePbSubscription } from '~/composables/usePbSubscription'

function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((r) => (resolve = r))
    return { promise, resolve }
}

describe('usePbSubscription', () => {
    it('unsubscribes when the component unmounts before subscribe resolves', async () => {
        const pendingSubscribe = deferred<() => Promise<void>>()
        const unsubscribe = vi.fn().mockResolvedValue(undefined)
        globalThis.__POCKETBASE_CLIENT__ = {
            collection: () => ({ subscribe: () => pendingSubscribe.promise }),
        }

        let subscribing: Promise<void> = Promise.resolve()
        const wrapper = mount(
            defineComponent({
                setup() {
                    const { subscribe } = usePbSubscription()
                    subscribing = subscribe('ratings', () => {})
                    return () => h('div')
                },
            }),
        )

        wrapper.unmount()
        pendingSubscribe.resolve(unsubscribe)
        await subscribing

        expect(unsubscribe).toHaveBeenCalledTimes(1)
    })

    it('keeps the subscription while mounted and releases it on unmount', async () => {
        const unsubscribe = vi.fn().mockResolvedValue(undefined)
        globalThis.__POCKETBASE_CLIENT__ = {
            collection: () => ({
                subscribe: () => Promise.resolve(unsubscribe),
            }),
        }

        let subscribing: Promise<void> = Promise.resolve()
        const wrapper = mount(
            defineComponent({
                setup() {
                    const { subscribe } = usePbSubscription()
                    subscribing = subscribe('ratings', () => {})
                    return () => h('div')
                },
            }),
        )

        await subscribing
        expect(unsubscribe).not.toHaveBeenCalled()
        wrapper.unmount()
        expect(unsubscribe).toHaveBeenCalledTimes(1)
    })
})
