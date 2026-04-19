export function usePermissions() {
    const pb = usePocketbase()
    const { tenantId } = useTenant()

    const permissions = useState<string[]>('user-permissions', () => [])
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
        if (!loaded.value) return false
        if (roleName.value === 'admin') return true
        return permissions.value.includes(featureName)
    }

    const isSuperAdmin = computed<boolean>(
        () => !!(pb.authStore.record as any)?.is_super_admin,
    )

    /**
     * Returns true if the current user is a member of the current tenant.
     * Used as a guard — the PocketBase rules are the authoritative check.
     */
    async function isInCurrentTenant(): Promise<boolean> {
        const userId = pb.authStore.record?.id
        const tid = tenantId.value
        if (!userId || !tid) return false
        try {
            await pb
                .collection('tenant_users')
                .getFirstListItem(`user_id = "${userId}" && tenant_id = "${tid}"`, {
                    requestKey: 'tenantMembership',
                })
            return true
        } catch {
            return false
        }
    }

    return {
        permissions,
        roleName,
        loading,
        loaded,
        can,
        isSuperAdmin,
        isInCurrentTenant,
        ensureLoaded,
        refreshPermissions,
    }
}
