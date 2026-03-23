import { usePocketbase } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (process.client) {
        const pb = usePocketbase()
        const isValidSession = pb.authStore.isValid

        // Pages that opt out of auth (login, password reset)
        if (to.meta.auth === false) {
            if (isValidSession) {
                return navigateTo('/admin/routes')
            }
            return
        }

        // All non-root pages require authentication
        if (to.path !== '/') {
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
    }
})
