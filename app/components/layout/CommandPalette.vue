<template>
    <v-btn
        icon
        variant="text"
        data-testid="command-palette-open"
        :aria-label="`${$t('nav.commandPalette')} (${shortcutLabel})`"
        @click="open = true"
    >
        <v-icon>mdi-magnify</v-icon>
    </v-btn>

    <v-dialog
        v-model="open"
        max-width="600"
        location="top"
        class="command-palette"
        data-testid="command-palette"
        @after-enter="searchInput?.focus()"
        @after-leave="query = ''"
    >
        <v-card rounded="xl">
            <v-text-field
                ref="searchInput"
                v-model="query"
                hide-details
                variant="solo"
                flat
                prepend-inner-icon="mdi-magnify"
                :loading="searching"
                :placeholder="$t('nav.commandPalettePlaceholder')"
                data-testid="command-palette-input"
                @keydown.down.prevent="moveActive(1)"
                @keydown.up.prevent="moveActive(-1)"
                @keydown.enter.prevent="choose(results[activeIndex])"
            />
            <v-divider />

            <v-list
                v-if="results.length"
                ref="resultList"
                density="compact"
                nav
                max-height="400"
                class="py-2"
            >
                <template v-for="group in groups" :key="group.key">
                    <v-list-subheader
                        :data-testid="`command-palette-group-${group.key}`"
                    >
                        {{ $t(group.label) }}
                    </v-list-subheader>
                    <v-list-item
                        v-for="result in group.items"
                        :key="result.key"
                        :active="result.index === activeIndex"
                        :prepend-icon="result.icon"
                        :title="result.title"
                        :subtitle="result.subtitle"
                        color="primary"
                        rounded="lg"
                        data-testid="command-palette-result"
                        @click="choose(result)"
                        @mousemove="activeIndex = result.index"
                    >
                        <template v-if="result.color" #prepend>
                            <span
                                class="route-dot mr-4"
                                :style="{ background: result.color }"
                            />
                        </template>
                    </v-list-item>
                </template>
            </v-list>

            <div
                v-else-if="!searching"
                class="pa-6 text-center text-body-medium text-medium-emphasis"
                data-testid="command-palette-empty"
            >
                {{ $t('nav.commandPaletteEmpty') }}
            </div>

            <v-divider />
            <div
                class="palette-footer d-flex flex-wrap ga-4 px-4 py-2 text-body-small text-medium-emphasis"
            >
                <span
                    ><kbd>↑</kbd><kbd>↓</kbd>
                    {{ $t('nav.paletteNavigate') }}</span
                >
                <span><kbd>↵</kbd> {{ $t('nav.paletteOpen') }}</span>
                <span><kbd>Esc</kbd> {{ $t('nav.paletteClose') }}</span>
            </div>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import type { SearchGroup, SearchResult } from '~/composables/useGlobalSearch'

const props = defineProps<{
    pages: { to: string; icon: string; label: string }[]
}>()

const { t } = useI18n()
const { search } = useGlobalSearch()
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)
const searching = ref(false)
const remoteGroups = ref<SearchGroup[]>([])
const searchInput = useTemplateRef<{ focus: () => void }>('searchInput')
const resultList = useTemplateRef<{ $el: HTMLElement }>('resultList')
const shortcutLabel = ref('Ctrl+K')

const pageResults = computed<SearchResult[]>(() => {
    const needle = query.value.trim().toLowerCase()
    return props.pages
        .map((page) => ({
            key: `page-${page.to}`,
            to: page.to,
            icon: page.icon,
            title: t(page.label),
        }))
        .filter((page) => page.title.toLowerCase().includes(needle))
})

const groups = computed(() => {
    let index = 0
    return [
        {
            key: 'pages',
            label: 'nav.paletteGroupPages',
            items: pageResults.value,
        },
        ...remoteGroups.value,
    ]
        .filter((group) => group.items.length)
        .map((group) => ({
            ...group,
            items: group.items.map((item) => ({ ...item, index: index++ })),
        }))
})

const results = computed(() => groups.value.flatMap((group) => group.items))

let searchDebounce: ReturnType<typeof setTimeout> | undefined

let searchRun = 0

watch(query, (value) => {
    activeIndex.value = 0
    clearTimeout(searchDebounce)
    const run = ++searchRun
    if (!value.trim()) {
        remoteGroups.value = []
        searching.value = false
        return
    }
    searching.value = true
    searchDebounce = setTimeout(async () => {
        const found = await search(value)
        if (run !== searchRun) return
        remoteGroups.value = found
        searching.value = false
    }, 200)
})

watch(activeIndex, async () => {
    await nextTick()
    resultList.value?.$el
        .querySelector('.v-list-item--active')
        ?.scrollIntoView({ block: 'nearest' })
})

function moveActive(step: number) {
    if (!results.value.length) return
    activeIndex.value =
        (activeIndex.value + step + results.value.length) % results.value.length
}

function choose(result: SearchResult | undefined) {
    if (!result) return
    open.value = false
    navigateTo(result.to)
}

function onShortcut(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open.value = !open.value
    }
}

onMounted(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) shortcutLabel.value = '⌘K'
    window.addEventListener('keydown', onShortcut)
})
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onShortcut)
    clearTimeout(searchDebounce)
})
</script>

<style scoped>
.command-palette :deep(.v-overlay__content) {
    margin-top: 12vh;
}

.route-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba(var(--v-theme-on-surface), 0.2);
}

.palette-footer kbd {
    display: inline-block;
    min-width: 20px;
    margin-right: 2px;
    padding: 0 4px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.7rem;
    text-align: center;
}
</style>
