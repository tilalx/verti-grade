import { usePocketbase } from '#imports'

export default defineNuxtRouteMiddleware(async (to) => {
    const pb = usePocketbase()
    const isValidSession = pb.authStore.isValid

    if (to.meta.auth === false) {
        if (isValidSession) {
            return navigateTo('/manage/routes')
        }
        return
    }

    if (to.path === '/') return

    if (!isValidSession) {
        return navigateTo('/auth/login')
    }

    const requiredPermission = to.meta.requiredPermission
    if (requiredPermission) {
        const { can, ensureLoaded } = usePermissions()
        await ensureLoaded()
        if (!can(requiredPermission)) {
            return navigateTo('/')
        }
    }
})
