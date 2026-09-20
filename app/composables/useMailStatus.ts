/**
 * Whether PocketBase has SMTP configured, so the UI can say that the DSA
 * Art. 16(4)/(5) notices are not being delivered.
 *
 * SMTP itself is configured in PocketBase, not in Verti-Grade — this only
 * reports the flag. Both the settings page and the reports queue share one
 * useAsyncData key, so it resolves once during SSR rather than once per page.
 *
 * Goes through pb.send() rather than a relative $fetch: /api/mail-status is a
 * PocketBase route, and only the production nginx maps /api/ onto PocketBase.
 * A relative fetch would hit the Nuxt server instead — 404 in dev and during
 * SSR — and silently report mail as configured. The SDK resolves its own base
 * URL correctly in all three places and attaches the auth token itself.
 */
export function useMailStatus() {
    const pb = usePocketbase()

    return useAsyncData<{ configured: boolean }>(
        'mail-status',
        async () => {
            try {
                return await pb.send('/api/mail-status', { method: 'GET' })
            } catch (err) {
                // Never let a missing status break the page it annotates, and
                // don't cry wolf on a transient error.
                return { configured: true }
            }
        },
        { default: () => ({ configured: true }) },
    )
}
