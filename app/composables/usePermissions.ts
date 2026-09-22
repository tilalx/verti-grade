export function usePermissions() {
    const pb = usePocketbase()
    const permissions = useState<string[]>('user-permissions', () => [])
    const roleName = useState<string>('user-role-name', () => '')
    const loading = ref(false)
    const loaded = useState<boolean>('user-permissions-loaded', () => false)

    /**
     * The request carries a fixed `requestKey`, so the PocketBase SDK aborts an
     * in-flight fetch as soon as a newer one starts -- which is exactly what
     * happens when a role update arrives over realtime while a refresh is
     * already running. That abort is a normal outcome, not a failure: the newer
     * request is about to deliver the answer, so the superseded one must leave
     * state alone instead of clearing permissions and alarming the user.
     */
    function isAutoCancelled(err: any) {
        return !!err?.isAbort || err?.status === 0
    }

    async function refreshPermissions() {
        const roleId = pb.authStore.record?.role
        if (!pb.authStore.isValid || !roleId) {
            permissions.value = []
            roleName.value = ''
            loaded.value = true
            return
        }

        loading.value = true
        let superseded = false
        try {
            const roleRecord = await pb.collection('roles').getOne(roleId, {
                expand: 'permissions',
                requestKey: 'userPermissions',
            })
            roleName.value = roleRecord.name
            const perms = (roleRecord.expand?.permissions as any[]) ?? []
            permissions.value = perms.map((p) => p.name)
        } catch (err) {
            if (isAutoCancelled(err)) {
                superseded = true
                return
            }
            console.error('Failed to fetch permissions:', err)
            permissions.value = []
            roleName.value = ''
            // useI18n() throws here: this runs after an await, so the
            // synchronous setup context it requires is already gone. The
            // app-level composer works anywhere, including route middleware.
            const { $i18n } = useNuxtApp()
            const { error: notifyError } = useNotification()
            notifyError($i18n.t('permissions.loadError'))
        } finally {
            // The newer request owns both flags -- flipping them here would
            // report "loaded" with the permissions momentarily emptied.
            if (!superseded) {
                loading.value = false
                loaded.value = true
            }
        }
    }

    async function ensureLoaded() {
        if (loaded.value) return
        await refreshPermissions()
    }

    function can(featureName: string): boolean {
        // Before permissions are loaded, allow navigation
        // (PocketBase rules enforce server-side anyway)
        if (!loaded.value) return true
        // Admin safety net: always has all permissions
        if (roleName.value === 'admin') return true
        return permissions.value.includes(featureName)
    }

    return {
        permissions,
        roleName,
        loading,
        loaded,
        can,
        ensureLoaded,
        refreshPermissions,
    }
}
