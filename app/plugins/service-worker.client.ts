export default defineNuxtPlugin(() => {
    if (import.meta.dev || !('serviceWorker' in navigator)) return
    const { buildId } = useRuntimeConfig().app
    navigator.serviceWorker
        .register(`/sw.js?build=${encodeURIComponent(buildId)}`)
        .catch((error) => {
            console.error('Service worker registration failed:', error)
        })
})
