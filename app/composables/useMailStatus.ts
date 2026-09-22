export function useMailStatus() {
    const pb = usePocketbase()

    return useAsyncData<{ configured: boolean }>(
        'mail-status',
        async () => {
            try {
                return await pb.send('/api/mail-status', { method: 'GET' })
            } catch (err) {
                return { configured: true }
            }
        },
        { default: () => ({ configured: true }) },
    )
}
