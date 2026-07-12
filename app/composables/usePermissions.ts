export function usePermissions() {
    const pb = usePocketbase()
    const permissions = useState<string[]>(
        'user-permissions',
        () => [],
    )
    const roleName = useState<string>('user-role-name', () => '')
    const loading = ref(false)
    const loaded = useState<boolean>('user-permissions-loaded', () => false)

    async function refreshPermissions() {
        const roleId = pb.authStore.record?.role
        if (!pb.authStore.isValid || !roleId) {
            permissions.value = []
            roleName.value = ''
            loaded.value = true
            return
        }

        loading.value = true
        try {
            const roleRecord = await pb.collection('roles').getOne(roleId, {
                expand: 'permissions',
                requestKey: 'userPermissions',
            })
            roleName.value = roleRecord.name
            const perms = (roleRecord.expand?.permissions as any[]) ?? []
            permissions.value = perms.map((p) => p.name)
        } catch (err) {
            console.error('Failed to fetch permissions:', err)
            permissions.value = []
            roleName.value = ''
            const { t } = useI18n()
            const { error: notifyError } = useNotification()
            notifyError(t('permissions.loadError'))
        } finally {
            loading.value = false
            loaded.value = true
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

    return { permissions, roleName, loading, loaded, can, ensureLoaded, refreshPermissions }
}
