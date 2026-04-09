<script setup lang="ts">
const search = defineModel<string>({ default: '' })

withDefaults(
    defineProps<{
        searchLabel?: string
        searchIcon?: string
        activeFilterCount?: number
    }>(),
    {
        searchIcon: 'mdi-magnify',
        activeFilterCount: 0,
    },
)

const emit = defineEmits<{ clear: [] }>()

const { smAndUp } = useDisplay()
const sheetOpen = ref(false)

function handleClear() {
    search.value = ''
    sheetOpen.value = false
    emit('clear')
}
</script>

<template>
    <v-card rounded="xl" border flat class="mb-4">
        <v-card-text class="pa-3">
            <div class="d-flex align-center ga-2">
                <v-text-field
                    v-model="search"
                    :label="searchLabel"
                    :prepend-inner-icon="searchIcon"
                    clearable
                    hide-details
                    density="compact"
                    variant="outlined"
                    rounded="lg"
                    class="flex-grow-1"
                />
                <!-- Mobile: open bottom sheet -->
                <v-btn
                    v-if="!smAndUp"
                    variant="tonal"
                    density="compact"
                    size="small"
                    icon
                    @click="sheetOpen = true"
                >
                    <v-badge
                        :model-value="activeFilterCount > 0"
                        :content="activeFilterCount"
                        color="primary"
                    >
                        <v-icon>mdi-filter-variant</v-icon>
                    </v-badge>
                </v-btn>
                <!-- Desktop: clear button when filters are active -->
                <v-btn
                    v-if="smAndUp && activeFilterCount > 0"
                    variant="text"
                    density="compact"
                    size="small"
                    prepend-icon="mdi-close"
                    @click="handleClear"
                >
                    {{ $t('actions.clear') }}
                </v-btn>
            </div>

            <!-- Desktop: inline filters below search -->
            <div v-if="smAndUp" class="mt-2">
                <slot name="filters" />
            </div>
        </v-card-text>
        <slot name="below" />
    </v-card>

    <!-- Mobile: filters in bottom sheet (same pattern as ReviewFormDialog) -->
    <v-bottom-sheet v-if="!smAndUp" v-model="sheetOpen" inset>
        <v-card class="py-2">
            <v-toolbar color="transparent" flat density="compact" class="pt-1">
                <v-toolbar-title class="text-body-1 font-weight-semibold pl-2">
                    {{ $t('filter.title') }}
                </v-toolbar-title>
                <template #append>
                    <v-btn
                        v-if="activeFilterCount > 0"
                        variant="text"
                        size="small"
                        color="error"
                        class="mr-1"
                        @click="handleClear"
                    >
                        {{ $t('actions.clear') }}
                    </v-btn>
                    <v-btn icon variant="text" @click="sheetOpen = false">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </template>
            </v-toolbar>
            <v-card-text>
                <slot name="filters" />
            </v-card-text>
        </v-card>
    </v-bottom-sheet>
</template>
