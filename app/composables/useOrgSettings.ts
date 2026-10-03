export function useOrgSettings() {
    const { data } = useSettingsRecord()

    return {
        orgName: computed(() => data.value?.organization_name || ''),
        orgUnitName: computed(() => data.value?.organization_unit_name || ''),
        allowRegistration: computed(() => !!data.value?.allow_registration),
    }
}
