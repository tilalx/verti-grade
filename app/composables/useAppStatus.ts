export function useAppStatus() {
    const pb = usePocketbase()

    const { data: health } = useAsyncData(
        'footer:health',
        () => pb.health.check(),
        { default: () => null, lazy: true },
    )

    const { data: online } = useAsyncData(
        'footer:online',
        () => pb.send('/api/online', { method: 'GET' }),
        { default: () => ({ clients: 0 }), lazy: true },
    )

    return {
        isHealthy: computed(() => health.value?.code === 200),
        onlineCount: computed(() => (online.value?.clients ?? 0) + 1),
    }
}
