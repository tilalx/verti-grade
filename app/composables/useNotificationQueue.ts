import type { NotificationRecord } from '~/types/models'

export function useNotificationQueue() {
    const pb = usePocketbase()
    const items = useState<NotificationRecord[]>('notification-queue', () => [])
    const loaded = useState<boolean>('notification-queue-loaded', () => false)

    const unreadCount = computed(
        () => items.value.filter((item) => !item.read).length,
    )

    function isAutoCancelled(err: any) {
        return !!err?.isAbort || err?.status === 0
    }

    async function refresh() {
        if (!pb.authStore.isValid) {
            items.value = []
            loaded.value = true
            return
        }

        try {
            items.value = await pb
                .collection('notifications')
                .getFullList<NotificationRecord>({
                    sort: '-created',
                    requestKey: 'notificationQueue',
                })
            loaded.value = true
        } catch (err) {
            if (isAutoCancelled(err)) return
            console.error('Failed to load notifications:', err)
            loaded.value = true
        }
    }

    async function markRead(id: string) {
        const item = items.value.find((entry) => entry.id === id)
        if (!item || item.read) return

        item.read = true
        try {
            await pb.collection('notifications').update(id, { read: true })
        } catch (err) {
            item.read = false
            console.error('Failed to mark notification read:', err)
        }
    }

    async function markAllRead() {
        const unread = items.value.filter((item) => !item.read)
        if (!unread.length) return

        unread.forEach((item) => (item.read = true))
        try {
            const batch = pb.createBatch()
            for (const item of unread) {
                batch
                    .collection('notifications')
                    .update(item.id, { read: true })
            }
            await batch.send()
        } catch (err) {
            unread.forEach((item) => (item.read = false))
            console.error('Failed to mark notifications read:', err)
        }
    }

    async function dismiss(id: string) {
        const index = items.value.findIndex((entry) => entry.id === id)
        if (index === -1) return

        const [removed] = items.value.splice(index, 1)
        try {
            await pb.collection('notifications').delete(id)
        } catch (err) {
            if (removed) items.value.splice(index, 0, removed)
            console.error('Failed to dismiss notification:', err)
        }
    }

    return {
        items,
        loaded,
        unreadCount,
        refresh,
        markRead,
        markAllRead,
        dismiss,
    }
}
