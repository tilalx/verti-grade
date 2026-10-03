import { gymBandsFrom, type GymBand } from '#shared/utils/gradeReference'
import type { SettingsRecord } from '~/types/models'

export function useGymBands() {
    const { t } = useI18n()
    const { data: settings } = useNuxtData<SettingsRecord>('settings')
    const bands = computed(() => gymBandsFrom(settings.value?.boulder_bands))
    const bandName = (band: GymBand) =>
        band.name ?? t(`gradeConversion.bands.${band.key}`)
    return { bands, bandName }
}
