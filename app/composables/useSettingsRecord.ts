import type { ClientResponseError } from 'pocketbase'
import type { SettingsRecord } from '~/types/models'

export const SETTINGS_ID = 'settings_123456'

export function useSettingsRecord() {
    const pb = usePocketbase()
    const { t } = useI18n()
    const { error: notifyError } = useNotification()

    return useAsyncData<SettingsRecord>('settings', async () => {
        try {
            return await pb
                .collection('settings')
                .getOne<SettingsRecord>(SETTINGS_ID)
        } catch (error) {
            if ((error as ClientResponseError).status !== 404) {
                console.error('An error occurred:', error)
                notifyError(t('settings.loadError'))
                throw error
            }
            try {
                return await pb
                    .collection('settings')
                    .create<SettingsRecord>({ id: SETTINGS_ID })
            } catch (createError) {
                console.error('Error creating new settings:', createError)
                notifyError(t('settings.initError'))
                throw createError
            }
        }
    })
}
