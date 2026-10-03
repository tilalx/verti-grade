export default defineNuxtPlugin((nuxtApp) => {
    const pb = usePocketbase()
    const outbox = useTickOutbox()
    const flush = () => outbox.flush().catch(() => {})
    let cachedUserId = pb.authStore.record?.id

    function forgetUserCaches() {
        void outbox.clearCachedTicks()
        navigator.serviceWorker?.controller?.postMessage({
            type: 'clear-pages',
        })
    }

    nuxtApp.hook('app:mounted', () => {
        void flush()
        window.addEventListener('online', flush)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void flush()
        })
        pb.realtime.subscribe('PB_CONNECT', flush).catch(() => {})
    })

    pb.authStore.onChange((token, record) => {
        if (!token) {
            cachedUserId = undefined
            return forgetUserCaches()
        }
        if (record?.id !== cachedUserId) forgetUserCaches()
        cachedUserId = record?.id
        void flush()
    })
})
