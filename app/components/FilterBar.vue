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
    <v-card border flat class="mb-4">
        <v-card-text class="pa-3">
            <div class="d-flex align-center ga-2">
                <v-text-field
                    v-model="search"
                    :label="searchLabel"
                    :prepend-inner-icon="searchIcon"
                    clearable
                    hide-details
                    density="compact"
                    class="flex-grow-1"
                    data-testid="filter-search"
                />
                <!-- Mobile: open bottom sheet -->
                <!-- No `density="compact"`: in Vuetify 4 it subtracts 12px,
                     shrinking a small button until it clips its own icon. -->
                <v-btn
                    v-if="!smAndUp"
                    variant="tonal"
                    size="small"
                    icon
                    :aria-label="$t('filter.title')"
                    data-testid="filter-open-sheet"
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
                    size="small"
                    prepend-icon="mdi-close"
                    data-testid="filter-clear"
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

    <!-- Mobile: filters in bottom sheet -->
    <v-bottom-sheet v-if="!smAndUp" v-model="sheetOpen" inset>
        <v-card class="py-2" data-testid="filter-sheet">
            <v-toolbar color="transparent" flat density="compact" class="pt-1">
                <v-toolbar-title
                    class="text-body-large font-weight-semibold pl-2"
                >
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
                    <v-btn
                        icon
                        variant="text"
                        :aria-label="$t('actions.close')"
                        @click="sheetOpen = false"
                    >
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
