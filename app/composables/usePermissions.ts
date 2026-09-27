interface RoleFetch {
    roleId: string
    promise: Promise<void>
}

const roleFetches = new WeakMap<object, RoleFetch>()

export function usePermissions() {
    const pb = usePocketbase()
    const permissions = useState<string[]>('user-permissions', () => [])
    const roleName = useState<string>('user-role-name', () => '')
    const loading = ref(false)
    const loaded = useState<boolean>('user-permissions-loaded', () => false)
    const loadedForRole = useState<string>('user-permissions-role', () => '')
    const nuxtApp = useNuxtApp()
    const { $i18n } = nuxtApp
    const { error: notifyError } = useNotification()

    function isAutoCancelled(err: any) {
        return !!err?.isAbort || err?.status === 0
    }

    function currentRoleId(): string {
        return (pb.authStore.isValid && pb.authStore.record?.role) || ''
    }

    async function fetchRole(roleId: string) {
        try {
            const roleRecord = await pb.collection('roles').getOne(roleId, {
                expand: 'permissions',
                requestKey: 'userPermissions',
            })
            if (currentRoleId() !== roleId) return
            roleName.value = roleRecord.name
            const perms = (roleRecord.expand?.permissions as any[]) ?? []
            permissions.value = perms.map((p) => p.name)
        } catch (err) {
            if (isAutoCancelled(err) || currentRoleId() !== roleId) return
            console.error('Failed to fetch permissions:', err)
            permissions.value = []
            roleName.value = ''
            notifyError($i18n.t('permissions.loadError'))
        }
        loadedForRole.value = roleId
        loaded.value = true
    }

    function startFetch(roleId: string) {
        const roleFetch: RoleFetch = {
            roleId,
            promise: fetchRole(roleId).finally(() => {
                if (roleFetches.get(nuxtApp) === roleFetch)
                    roleFetches.delete(nuxtApp)
            }),
        }
        roleFetches.set(nuxtApp, roleFetch)
    }

    async function awaitLatestFetch() {
        loading.value = true
        let pending: RoleFetch | undefined
        while ((pending = roleFetches.get(nuxtApp))) await pending.promise
        loading.value = false
    }

    async function refreshPermissions() {
        const roleId = currentRoleId()
        if (!roleId) {
            pb.cancelRequest('userPermissions')
            roleFetches.delete(nuxtApp)
            permissions.value = []
            roleName.value = ''
            loadedForRole.value = ''
            loaded.value = true
            return
        }
        startFetch(roleId)
        await awaitLatestFetch()
    }

    async function ensureLoaded() {
        const roleId = currentRoleId()
        const pending = roleFetches.get(nuxtApp)
        if (pending?.roleId === roleId) return awaitLatestFetch()
        if (!pending && loaded.value && loadedForRole.value === roleId) return
        await refreshPermissions()
    }

    function can(featureName: string): boolean {
        if (!loaded.value) return false
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
