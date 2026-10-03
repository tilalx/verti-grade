export function useNow(intervalMs = 15_000) {
    const now = ref(new Date())
    let timer: ReturnType<typeof setInterval> | undefined
    onMounted(() => {
        timer = setInterval(() => (now.value = new Date()), intervalMs)
    })
    onBeforeUnmount(() => clearInterval(timer))
    return now
}
