import { usePocketbase } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (process.client) {
        const pb = usePocketbase()
        const isValidSession = pb.authStore.isValid

        // Tenant membership guard — checked once per client session
        const tenantOk = useState('auth_tenant_ok', () => null)
        if (!isValidSession) {
            tenantOk.value = null // reset on logout
        } else if (tenantOk.value === null && !pb.authStore.record?.is_super_admin) {
            try {
                const tenant = await $fetch('/api/tenant').catch(() => null)
                if (tenant?.id) {
                    await pb
                        .collection('tenant_users')
                        .getFirstListItem(
                            `tenant_id = "${tenant.id}" && user_id = "${pb.authStore.record?.id}"`,
                        )
                }
                tenantOk.value = true
            } catch {
                tenantOk.value = false
                pb.authStore.clear()
                return navigateTo('/auth/login')
            }
        }

        // Pages that opt out of auth (login, password reset)
        if (to.meta.auth === false) {
            if (isValidSession) {
                return navigateTo('/admin/routes')
            }
            return
        }

        // Super-admin pages require is_super_admin flag
        if (to.path.startsWith('/super-admin')) {
            if (!isValidSession) {
                return navigateTo('/auth/login')
            }
            const isSuperAdmin = !!pb.authStore.record?.is_super_admin
            if (!isSuperAdmin) {
                return navigateTo('/')
            }
            return
        }

        // All pages require authentication (routes list is tenant-scoped and not public)
        if (!isValidSession) {
            return navigateTo('/auth/login')
        }

        // Permission check for admin pages
        const requiredPermission = to.meta.requiredPermission
        if (requiredPermission) {
            const { can, ensureLoaded } = usePermissions()
            await ensureLoaded()
            if (!can(requiredPermission)) {
                return navigateTo('/')
            }
        }
    }
})
