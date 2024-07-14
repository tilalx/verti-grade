import { usePocketbase } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from, next) => {
    const authRequired = to.meta.authRequired || true

    const pb = usePocketbase()

    // Retrieve the current session from Supabase
    const isValidSession = pb.authStore.isValid

    if (authRequired && to.path !== '/') {
        if (!isValidSession) {
            // If the session is not valid, redirect to the login page
            return navigateTo('/login')
        }
        if (to.name === 'Login' && isValidSession) {
            // Redirect to the dashboard if already logged in and trying to access the login page
            return navigateTo('/dashboard')
        }
    }
})
