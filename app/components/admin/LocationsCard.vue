<template>
    <v-card border flat class="mb-6" data-testid="settings-locations">
        <v-card-text class="pa-4">
            <p class="text-title-small font-weight-semibold mb-1">
                {{ $t('settings.locations') }}
            </p>
            <p class="text-body-small text-medium-emphasis mb-4">
                {{ $t('settings.locationsIntro') }}
            </p>

            <div class="location-list">
                <div
                    v-for="location in locations"
                    :key="location.id"
                    class="location-row"
                    data-testid="settings-location"
                    :data-name="location.name"
                >
                    <v-text-field
                        v-model="draftNames[location.id]"
                        :label="$t('settings.locationName')"
                        density="compact"
                        hide-details="auto"
                        prepend-inner-icon="mdi-map-marker-outline"
                        :maxlength="100"
                        data-testid="settings-location-name"
                        @blur="rename(location)"
                        @keydown.enter="rename(location)"
                    />
                    <v-btn
                        icon="mdi-delete-outline"
                        variant="text"
                        color="error"
                        density="comfortable"
                        :loading="busyId === location.id"
                        :aria-label="$t('settings.locationDelete')"
                        :title="$t('settings.locationDelete')"
                        data-testid="settings-location-delete"
                        @click="remove(location)"
                    />
                </div>
            </div>

            <form class="location-row mt-3" @submit.prevent="add">
                <v-text-field
                    v-model="newName"
                    :label="$t('settings.locationNew')"
                    density="compact"
                    hide-details="auto"
                    prepend-inner-icon="mdi-map-marker-plus-outline"
                    :maxlength="100"
                    data-testid="settings-location-new"
                />
                <v-btn
                    type="submit"
                    variant="tonal"
                    :disabled="!newName.trim()"
                    :loading="busyId === 'new'"
                    data-testid="settings-location-add"
                >
                    {{ $t('settings.locationAdd') }}
                </v-btn>
            </form>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import type { LocationRecord } from '~/types/models'

const pb = usePocketbase()
const { t } = useI18n()
const { success: notifySuccess, error: notifyError } = useNotification()
const { data: locations, refresh } = useLocations()

const newName = ref('')
const busyId = ref<string | null>(null)
const draftNames = reactive<Record<string, string>>({})

watch(
    locations,
    (records) => {
        for (const record of records) draftNames[record.id] = record.name
    },
    { immediate: true },
)

async function run(id: string, action: () => Promise<unknown>) {
    busyId.value = id
    try {
        await action()
        await refresh()
        notifySuccess(t('settings.locationSaved'))
        return true
    } catch (error) {
        const inUse = (error as { status?: number }).status === 400
        notifyError(
            t(
                inUse
                    ? 'settings.locationSaveFailed'
                    : 'notifications.error.generic',
            ),
        )
        return false
    } finally {
        busyId.value = null
    }
}

async function add() {
    const name = newName.value.trim()
    if (!name) return
    if (await run('new', () => pb.collection('locations').create({ name }))) {
        newName.value = ''
    }
}

async function rename(location: LocationRecord) {
    const name = draftNames[location.id]?.trim() ?? ''
    if (!name || name === location.name) {
        draftNames[location.id] = location.name
        return
    }
    const saved = await run(location.id, () =>
        pb.collection('locations').update(location.id, { name }),
    )
    if (!saved) draftNames[location.id] = location.name
}

function remove(location: LocationRecord) {
    return run(location.id, () =>
        pb.collection('locations').delete(location.id),
    )
}
</script>

<style scoped>
.location-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.location-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
</style>
