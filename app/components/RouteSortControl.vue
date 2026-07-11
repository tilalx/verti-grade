<script setup lang="ts">
import type { SortOption } from '~/utils/sorting'

export interface SortItem {
    title: string
    key: string
    /** Direction used when the field is first selected. Defaults to 'asc'. */
    defaultOrder?: 'asc' | 'desc'
}

const modelValue = defineModel<SortOption[]>({ default: () => [] })

const props = defineProps<{
    items: SortItem[]
}>()

const activeKey = computed(() => modelValue.value[0]?.key ?? null)
const isDescending = computed(() => modelValue.value[0]?.order === 'desc')

function onKeyChange(key: string | null) {
    if (!key || key === activeKey.value) return
    const item = props.items.find((i) => i.key === key)
    modelValue.value = [{ key, order: item?.defaultOrder ?? 'asc' }]
}

function toggleOrder() {
    const current = modelValue.value[0]
    if (!current) return
    modelValue.value = [
        { key: current.key, order: isDescending.value ? 'asc' : 'desc' },
    ]
}
</script>

<template>
    <div class="d-flex align-center ga-2">
        <v-select
            :model-value="activeKey"
            :items="props.items"
            :label="$t('table.sort_by')"
            item-title="title"
            item-value="key"
            hide-details
            density="compact"
            variant="outlined"
            rounded="lg"
            class="flex-grow-1"
            @update:modelValue="onKeyChange"
        />
        <v-btn
            variant="tonal"
            density="comfortable"
            size="small"
            icon
            :disabled="!activeKey"
            :aria-label="
                isDescending ? $t('table.sort_desc') : $t('table.sort_asc')
            "
            @click="toggleOrder"
        >
            <v-icon>{{
                isDescending ? 'mdi-sort-descending' : 'mdi-sort-ascending'
            }}</v-icon>
        </v-btn>
    </div>
</template>
