export default defineNuxtPlugin((nuxtApp) => {
    const pb = usePocketbase()
    const outbox = useTickOutbox()
    const flush = () => outbox.flush().catch(() => {})

    nuxtApp.hook('app:mounted', () => {
        void flush()
        window.addEventListener('online', flush)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') void flush()
        })
        pb.realtime.subscribe('PB_CONNECT', flush).catch(() => {})
    })

    pb.authStore.onChange((token) => {
        if (token) return void flush()
        void outbox.clear()
        navigator.serviceWorker?.controller?.postMessage({
            type: 'clear-pages',
        })
    })
})
