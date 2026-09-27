import { isAbortError } from '~/utils/errors'

interface AsyncActionMessages {
    success?: string
    error?: string | ((error: unknown) => string)
}

export function useAsyncAction() {
    const { t } = useI18n()
    const { success: notifySuccess, error: notifyError } = useNotification()
    const pending = ref(false)

    async function run<TResult>(
        action: () => Promise<TResult>,
        messages: AsyncActionMessages = {},
    ): Promise<TResult | undefined> {
        pending.value = true
        try {
            const result = await action()
            if (messages.success) notifySuccess(messages.success)
            return result
        } catch (error) {
            if (isAbortError(error)) return undefined
            console.error(error)
            const errorMessage =
                typeof messages.error === 'function'
                    ? messages.error(error)
                    : messages.error
            notifyError(errorMessage ?? t('notifications.error.generic'))
            return undefined
        } finally {
            pending.value = false
        }
    }

    return { pending, run }
}
