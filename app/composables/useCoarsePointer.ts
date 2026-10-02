export function useCoarsePointer() {
    const coarse = ref(false)
    onMounted(() => {
        coarse.value = !!window.matchMedia?.('(pointer: coarse)').matches
    })
    return coarse
}
