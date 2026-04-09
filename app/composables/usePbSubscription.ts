type UnsubFn = () => void | Promise<void>

export function usePbSubscription() {
    const pb = usePocketbase()
    const subscriptions = new Map<string, UnsubFn>()

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
            .subscribe(topic, callback)
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

    onBeforeUnmount(() => {
        subscriptions.forEach((fn) => {
            try {
                fn()
            } catch {}
        })
        subscriptions.clear()
    })

    return { subscribe, unsubscribeFrom }
}
