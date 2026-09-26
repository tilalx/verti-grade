import type { SettingsRecord } from '~/types/models'

export function useOrgSettings() {
    const pb = usePocketbase()
    const { data } = useAsyncData('org-settings', () =>
        pb
            .collection('settings')
            .getOne<SettingsRecord>('settings_123456')
            .catch(() => null),
    )

    return {
        orgName: computed(() => data.value?.organization_name || ''),
        orgUnitName: computed(() => data.value?.organization_unit_name || ''),
        allowRegistration: computed(() => !!data.value?.allow_registration),
    }
}
