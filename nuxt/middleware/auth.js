// This assumes you have set up a Supabase plugin that exports useSupabaseClient
import { useSupabaseClient } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from, next) => {
    const authRequired = to.meta.authRequired || true

    // Use the Supabase client from the Nuxt composable
    const supabase = useSupabaseClient()

    // Retrieve the current session from Supabase
    const session = await supabase.auth.getSession()

    // Helper function to verify the session is still valid
    function isSessionValid(session) {
        if (!session) return false // Check if there is a session at all
        const currentUnixTime = Math.floor(Date.now() / 1000)
        return session.data.session?.expires_at > currentUnixTime
    }

    const isValidSession = isSessionValid(session)

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
