<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
    confirm: [payload: { columns: string[]; labels: Record<string, string> }]
}>()

const { t } = useI18n()

const STORAGE_KEY = 'verti-grade.export-columns'

const EXPORT_COLUMNS = [
    { key: 'color', labelKey: 'climbing.color' },
    { key: 'name', labelKey: 'climbing.routename' },
    { key: 'difficulty', labelKey: 'climbing.difficulty' },
    { key: 'anchor_point', labelKey: 'climbing.anchor_point' },
    { key: 'comment', labelKey: 'climbing.comment' },
    { key: 'creator', labelKey: 'climbing.creators' },
    { key: 'location', labelKey: 'climbing.location' },
    { key: 'type', labelKey: 'climbing.type' },
    { key: 'screw_date', labelKey: 'routes.screwed_at' },
    { key: 'qr', labelKey: 'export.qr_code' },
]

const DEFAULT_ORDER = EXPORT_COLUMNS.map((column) => column.key)
const DEFAULT_SELECTED = DEFAULT_ORDER.filter((key) => key !== 'qr')

const stored = readStored()
const order = ref<string[]>(stored.order)
const selected = ref<string[]>(stored.selected)
const dragKey = ref<string | null>(null)

const orderedColumns = computed(() =>
    order.value.map((key) =>
        EXPORT_COLUMNS.find((column) => column.key === key)!,
    ),
)
const allSelected = computed(
    () => selected.value.length === EXPORT_COLUMNS.length,
)

function sanitizeOrder(keys: unknown): string[] | null {
    if (!Array.isArray(keys)) {
        return null
    }
    const known = keys.filter((key) => DEFAULT_ORDER.includes(key))
    const missing = DEFAULT_ORDER.filter((key) => !known.includes(key))
    return known.length ? [...known, ...missing] : null
}

function readStored(): { order: string[]; selected: string[] } {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
        const storedOrder = sanitizeOrder(parsed?.order)
        const storedSelected = Array.isArray(parsed?.selected)
            ? parsed.selected.filter((key: string) =>
                  DEFAULT_ORDER.includes(key),
              )
            : null
        if (storedOrder || storedSelected?.length) {
            return {
                order: storedOrder ?? [...DEFAULT_ORDER],
                selected: storedSelected?.length
                    ? storedSelected
                    : [...DEFAULT_SELECTED],
            }
        }
    } catch {}
    return { order: [...DEFAULT_ORDER], selected: [...DEFAULT_SELECTED] }
}

const moveTo = (key: string, index: number) => {
    const next = order.value.filter((entry) => entry !== key)
    next.splice(Math.max(0, Math.min(index, next.length)), 0, key)
    order.value = next
}

const move = (key: string, offset: number) =>
    moveTo(key, order.value.indexOf(key) + offset)

const onDrop = (targetKey: string) => {
    if (dragKey.value && dragKey.value !== targetKey) {
        moveTo(dragKey.value, order.value.indexOf(targetKey))
    }
    dragKey.value = null
}

const toggleAll = () => {
    selected.value = allSelected.value ? [] : [...DEFAULT_ORDER]
}

const confirm = () => {
    const columns = order.value.filter((key) => selected.value.includes(key))

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ order: order.value, selected: selected.value }),
        )
    } catch {}

    emit('confirm', {
        columns,
        labels: Object.fromEntries(
            columns.map((key) => [
                key,
                t(
                    EXPORT_COLUMNS.find((column) => column.key === key)!
                        .labelKey,
                ),
            ]),
        ),
    })
    open.value = false
}
</script>

<template>
    <LayoutDialogShell
        v-model="open"
        :title="$t('export.title')"
        data-testid="export-options-dialog"
    >
        <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-medium text-medium-emphasis">
                {{ $t('export.columns') }}
            </span>
            <v-btn
                variant="text"
                size="small"
                data-testid="export-toggle-all"
                @click="toggleAll"
            >
                {{
                    allSelected
                        ? $t('actions.deselect_all')
                        : $t('actions.select_all')
                }}
            </v-btn>
        </div>
        <div
            v-for="(column, index) in orderedColumns"
            :key="column.key"
            class="export-column d-flex align-center"
            draggable="true"
            :data-testid="`export-column-${column.key}`"
            @dragstart="dragKey = column.key"
            @dragover.prevent
            @drop.prevent="onDrop(column.key)"
        >
            <v-icon class="export-column__handle" size="small">
                mdi-drag-horizontal-variant
            </v-icon>
            <v-checkbox
                v-model="selected"
                :value="column.key"
                :label="$t(column.labelKey)"
                density="compact"
                hide-details
            />
            <v-spacer />
            <v-btn
                icon="mdi-chevron-up"
                variant="text"
                size="small"
                :disabled="index === 0"
                :aria-label="$t('export.move_up')"
                :data-testid="`export-move-up-${column.key}`"
                @click="move(column.key, -1)"
            />
            <v-btn
                icon="mdi-chevron-down"
                variant="text"
                size="small"
                :disabled="index === orderedColumns.length - 1"
                :aria-label="$t('export.move_down')"
                :data-testid="`export-move-down-${column.key}`"
                @click="move(column.key, 1)"
            />
        </div>
        <template #actions>
            <v-btn variant="text" @click="open = false">
                {{ $t('actions.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn
                color="primary"
                :disabled="!selected.length"
                data-testid="export-confirm"
                @click="confirm"
            >
                {{ $t('actions.export') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<style scoped>
.export-column__handle {
    cursor: grab;
    margin-right: 8px;
}
</style>
