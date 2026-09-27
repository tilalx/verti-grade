export function useDiscardConfirm(hasChanges: () => boolean) {
    const discardDialogOpen = ref(false)
    let resolvePending: ((confirmed: boolean) => void) | null = null

    function settleDiscard(confirmed: boolean) {
        const resolve = resolvePending
        resolvePending = null
        discardDialogOpen.value = false
        resolve?.(confirmed)
    }

    function confirmDiscard() {
        if (!hasChanges()) return Promise.resolve(true)
        settleDiscard(false)
        discardDialogOpen.value = true
        return new Promise<boolean>((resolve) => {
            resolvePending = resolve
        })
    }

    watch(discardDialogOpen, (open) => {
        if (!open) settleDiscard(false)
    })

    return { discardDialogOpen, confirmDiscard, settleDiscard }
}
