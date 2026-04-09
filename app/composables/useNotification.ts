type NotificationColor = 'success' | 'error' | 'warning' | 'info'

export function useNotification() {
    const message = useState<string>('notification-message', () => '')
    const color = useState<NotificationColor>('notification-color', () => 'success')
    const visible = useState<boolean>('notification-visible', () => false)

    function notify(msg: string, c: NotificationColor = 'success') {
        message.value = msg
        color.value = c
        visible.value = true
    }

    const success = (msg: string) => notify(msg, 'success')
    const error = (msg: string) => notify(msg, 'error')
    const warning = (msg: string) => notify(msg, 'warning')
    const info = (msg: string) => notify(msg, 'info')

    return { message, color, visible, notify, success, error, warning, info }
}
