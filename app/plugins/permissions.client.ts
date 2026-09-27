export default defineNuxtPlugin(() => {
    const pb = usePocketbase()
    const { ensureLoaded } = usePermissions()
    pb.authStore.onChange(() => ensureLoaded())
})
