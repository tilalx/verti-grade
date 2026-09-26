export type NotificationColor = 'success' | 'error' | 'warning' | 'info'

export interface NotificationItem {
    text: string
    color: NotificationColor
}

export function useNotification() {
    const queue = useState<NotificationItem[]>('snackbar-queue', () => [])

    function notify(text: string, color: NotificationColor = 'success') {
        queue.value = [...queue.value, { text, color }]
    }

    const success = (msg: string) => notify(msg, 'success')
    const error = (msg: string) => notify(msg, 'error')
    const warning = (msg: string) => notify(msg, 'warning')
    const info = (msg: string) => notify(msg, 'info')

    return { queue, notify, success, error, warning, info }
}
