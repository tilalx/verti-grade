type UnsubFn = () => void | Promise<void>

export function usePbSubscription(onReactivate?: () => void) {
    const pb = usePocketbase()
    const subscriptions = new Map<string, UnsubFn>()
    let unmounted = false
    let active = true
    let missedWhileInactive = false

    async function subscribe(
        collection: string,
        callback: (e: any) => void | Promise<void>,
        topic = '*',
    ): Promise<void> {
        const key = `${collection}:${topic}`
        const existing = subscriptions.get(key)
        if (existing) {
            try {
                await existing()
            } catch {}
            subscriptions.delete(key)
        }
        const unsub: UnsubFn = await pb
            .collection(collection)
            .subscribe(topic, (e) => {
                if (!active) {
                    missedWhileInactive = true
                    return
                }
                return callback(e)
            })
        if (unmounted) {
            try {
                await unsub()
            } catch {}
            return
        }
        subscriptions.set(key, unsub)
    }

    async function unsubscribeFrom(
        collection: string,
        topic = '*',
    ): Promise<void> {
        const key = `${collection}:${topic}`
        const unsub = subscriptions.get(key)
        if (unsub) {
            try {
                await unsub()
            } catch {}
            subscriptions.delete(key)
        }
    }

    onDeactivated(() => {
        active = false
    })

    onActivated(() => {
        active = true
        if (!missedWhileInactive) return
        missedWhileInactive = false
        onReactivate?.()
    })

    onBeforeUnmount(() => {
        unmounted = true
        subscriptions.forEach((fn) => {
            try {
                fn()
            } catch {}
        })
        subscriptions.clear()
    })

    return { subscribe, unsubscribeFrom }
}
