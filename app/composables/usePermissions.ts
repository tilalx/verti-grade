export function usePermissions() {
    const pb = usePocketbase()
    const permissions = useState<string[]>('user-permissions', () => [])
    const roleName = useState<string>('user-role-name', () => '')
    const loading = ref(false)
    const loaded = useState<boolean>('user-permissions-loaded', () => false)

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
            const { $i18n } = useNuxtApp()
            const { error: notifyError } = useNotification()
            notifyError($i18n.t('permissions.loadError'))
        } finally {
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
        if (!loaded.value) return true
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
