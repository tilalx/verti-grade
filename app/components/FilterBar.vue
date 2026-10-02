<script setup lang="ts">
const search = defineModel<string>({ default: '' })

const props = withDefaults(
    defineProps<{
        searchLabel?: string
        searchPlaceholder?: string
        searchIcon?: string
        activeFilterCount?: number
    }>(),
    {
        searchIcon: 'i-lucide-search',
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
    <div class="mb-4 rounded-lg border bg-default">
        <div class="flex flex-wrap items-center gap-2 p-3">
            <slot name="search">
                <UInput
                    v-model="search"
                    :placeholder="searchPlaceholder || searchLabel"
                    :aria-label="searchLabel"
                    :icon="searchIcon"
                    class="min-w-0 flex-1 sm:min-w-72"
                    data-testid="filter-search"
                >
                    <template v-if="search" #trailing>
                        <UButton
                            icon="i-lucide-x"
                            color="neutral"
                            variant="link"
                            size="sm"
                            :aria-label="$t('actions.clear')"
                            @click="search = ''"
                        />
                    </template>
                </UInput>
            </slot>
            <div v-if="smAndUp" class="flex flex-wrap items-center gap-2">
                <slot name="filters" />
            </div>
            <UButton
                v-if="!smAndUp"
                variant="soft"
                color="neutral"
                size="lg"
                :aria-label="$t('filter.title')"
                data-testid="filter-open-sheet"
                @click="sheetOpen = true"
            >
                <UChip
                    :show="activeFilterCount > 0"
                    :text="activeFilterCount"
                    color="primary"
                    size="3xl"
                >
                    <UIcon name="i-lucide-list-filter" class="size-5" />
                </UChip>
            </UButton>
            <UButton
                v-if="smAndUp && activeFilterCount > 0"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                data-testid="filter-clear"
                @click="handleClear"
            >
                {{ $t('actions.clear') }}
            </UButton>
        </div>
        <slot name="below" />
    </div>

    <UDrawer
        v-if="!smAndUp"
        v-model:open="sheetOpen"
        :title="$t('filter.title')"
    >
        <template #content>
            <div
                class="pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
                data-testid="filter-sheet"
            >
                <div class="flex items-center gap-1 px-4 pt-1">
                    <span class="text-base font-semibold">
                        {{ $t('filter.title') }}
                    </span>
                    <div class="flex-1" />
                    <UButton
                        v-if="activeFilterCount > 0"
                        variant="ghost"
                        size="sm"
                        color="error"
                        @click="handleClear"
                    >
                        {{ $t('actions.clear') }}
                    </UButton>
                    <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        :aria-label="$t('actions.close')"
                        @click="sheetOpen = false"
                    />
                </div>
                <div class="flex flex-col gap-3 p-4">
                    <slot name="filters" />
                </div>
            </div>
        </template>
    </UDrawer>
</template>
