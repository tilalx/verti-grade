import { describe, expect, it, vi } from 'vitest'
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue'
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

describe('usePbSubscription keepalive', () => {
    it('drops events while deactivated and reloads once on activate', async () => {
        let handler: (e: unknown) => void = () => {}
        globalThis.__POCKETBASE_CLIENT__ = {
            collection: () => ({
                subscribe: (_topic: string, cb: (e: unknown) => void) => {
                    handler = cb
                    return Promise.resolve(vi.fn())
                },
            }),
        }
        const onEvent = vi.fn()
        const onReactivate = vi.fn()
        let subscribing: Promise<void> = Promise.resolve()
        const show = ref(true)
        const Child = defineComponent({
            setup() {
                const { subscribe } = usePbSubscription(onReactivate)
                subscribing = subscribe('routes', onEvent)
                return () => h('div')
            },
        })
        mount(
            defineComponent({
                setup: () => () =>
                    h(KeepAlive, null, [show.value ? h(Child) : null]),
            }),
        )
        await subscribing

        handler({ action: 'update' })
        expect(onEvent).toHaveBeenCalledTimes(1)

        show.value = false
        await nextTick()
        handler({ action: 'update' })
        expect(onEvent).toHaveBeenCalledTimes(1)
        expect(onReactivate).not.toHaveBeenCalled()

        show.value = true
        await nextTick()
        expect(onReactivate).toHaveBeenCalledTimes(1)

        show.value = false
        await nextTick()
        show.value = true
        await nextTick()
        expect(onReactivate).toHaveBeenCalledTimes(1)
    })
})
