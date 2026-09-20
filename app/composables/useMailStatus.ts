/**
 * Whether PocketBase has SMTP configured, so the UI can say that the DSA
 * Art. 16(4)/(5) notices are not being delivered.
 *
 * SMTP itself is configured in PocketBase, not in Verti-Grade — this only
 * reports the flag. Both the settings page and the reports queue share one
 * useAsyncData key, so it resolves once during SSR rather than once per page.
 */
export function useMailStatus() {
    const requestFetch = useRequestFetch()
    const pb = usePocketbase()

    return useAsyncData<{ configured: boolean }>(
        'mail-status',
        async () => {
            try {
                return await requestFetch<{ configured: boolean }>('/api/mail-status', {
                    headers: pb.authStore.token
                        ? { Authorization: pb.authStore.token }
                        : undefined,
                })
            } catch (err) {
                // Never let a missing status break the page it annotates;
                // assume configured so we don't cry wolf on a transient error.
                return { configured: true }
            }
        },
        { default: () => ({ configured: true }) },
    )
}
