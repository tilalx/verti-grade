<template>
    <v-dialog v-model="dialogOpen" max-width="560" scrollable>
        <v-card>
            <v-card-title class="pa-4 pb-3">
                <span class="text-h6">{{
                    isEditMode ? $t('actions.edit') : $t('climbing.create')
                }}</span>
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-4">
                <v-form ref="formRef" @submit.prevent="submit">
                    <!-- Name -->
                    <v-text-field
                        v-model="form.name"
                        :label="$t('routes.name')"
                        :rules="nameRules"
                        maxlength="30"
                        counter
                        required
                        density="comfortable"
                        class="mb-1"
                    />

                    <!-- Difficulty and Type -->
                    <v-row density="comfortable" class="mb-1">
                        <v-col cols="6">
                            <v-select
                                v-model="form.combinedDifficulty"
                                :label="$t('climbing.difficulty')"
                                :items="combinedDifficulties"
                                :rules="[requiredRule]"
                                required
                                density="comfortable"
                            />
                        </v-col>
                        <v-col cols="6">
                            <v-select
                                v-model="form.type"
                                :label="$t('climbing.type')"
                                :items="typeItems"
                                item-title="title"
                                item-value="value"
                                :rules="[requiredRule]"
                                required
                                density="comfortable"
                            />
                        </v-col>
                    </v-row>

                    <!-- Anchor Point and Location -->
                    <v-row density="comfortable" class="mb-1">
                        <v-col cols="6">
                            <v-text-field
                                v-model.number="form.anchor_point"
                                :label="$t('climbing.anchor_point')"
                                :rules="anchorPointRules"
                                type="number"
                                :min="isBoulderRoute ? 0 : 1"
                                max="100"
                                step="1"
                                required
                                density="comfortable"
                            />
                        </v-col>
                        <v-col cols="6">
                            <v-select
                                v-model="form.location"
                                :label="$t('climbing.location')"
                                :items="locations"
                                :rules="[requiredRule]"
                                required
                                density="comfortable"
                            />
                        </v-col>
                    </v-row>

                    <!-- Route Setter -->
                    <v-combobox
                        v-model="form.creator"
                        :label="$t('routes.route_setter')"
                        :items="setterItems"
                        :rules="[creatorRule]"
                        multiple
                        chips
                        closable-chips
                        required
                        density="comfortable"
                        class="mb-1"
                    />

                    <!-- Screwed at and Archived -->
                    <v-row density="comfortable" class="mb-1">
                        <v-col cols="6">
                            <v-text-field
                                v-model="form.screw_date"
                                :label="$t('routes.screwed_at')"
                                type="date"
                                :rules="[requiredRule]"
                                required
                                density="comfortable"
                            />
                        </v-col>
                        <v-col v-if="isEditMode" cols="6" style="align-self: stretch; display: flex; align-items: center; justify-content: center;">
                            <v-switch
                                v-model="form.archived"
                                :label="$t('climbing.archived')"
                                color="primary"
                                density="compact"
                                hide-details
                            />
                        </v-col>
                    </v-row>

                    <!-- Comment -->
                    <v-textarea
                        v-model="form.comment"
                        :label="$t('climbing.comment')"
                        rows="2"
                        auto-grow
                        counter="255"
                        density="comfortable"
                        class="mb-2"
                    />

                    <!-- Color picker -->
                    <div class="color-picker-section">
                        <v-color-picker
                            v-model="form.color"
                            hide-inputs
                            :modes="['hex']"
                            width="100%"
                            elevation="0"
                        />

                        <!-- Palette: similar colors when picker changed, default otherwise -->
                        <div class="d-flex flex-wrap ga-1 mt-2 mb-1">
                            <button
                                v-for="c in activePalette"
                                :key="c"
                                type="button"
                                class="color-dot"
                                :style="{
                                    backgroundColor: c,
                                    boxShadow: form.color?.toUpperCase() === c.toUpperCase() ? '0 0 0 2px white, 0 0 0 4px ' + c : 'none',
                                }"
                                @click="form.color = c"
                            />
                        </div>
                    </div>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-3">
                <v-btn
                    v-if="isEditMode"
                    color="error"
                    variant="text"
                    prepend-icon="mdi-delete-outline"
                    @click="deleteDialog = true"
                >
                    {{ $t('actions.delete') }}
                </v-btn>
                <v-spacer />
                <v-btn variant="text" @click="close">{{
                    $t('actions.cancel')
                }}</v-btn>
                <v-btn
                    color="primary"
                    variant="tonal"
                    :loading="saving"
                    @click="submit"
                >
                    {{ isEditMode ? $t('actions.save') : $t('actions.create') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <ConfirmDialog
        v-model="deleteDialog"
        :title="$t('actions.confirm')"
        :message="$t('notifications.deleteItem')"
        :loading="deleting"
        @confirm="deleteRoute"
    />
</template>

<script setup lang="ts">
import type PocketBase from 'pocketbase'
import type { RouteRecord } from '~/types/models'
import { normalizeCreators, formatDateToYYYYMMDD } from '~/utils/formatting'
import { required } from '~/utils/validation'

const { t } = useI18n()
const pb = usePocketbase() as PocketBase

type VFormHandle = {
    validate: () => Promise<{ valid: boolean }>
    reset: () => void
} | null

const fallbackColors = [
    '#F44336', '#FF9800', '#FFC107',
    '#4CAF50', '#009688', '#2196F3',
    '#673AB7', '#E91E63', '#FF5722',
    '#8BC34A', '#00BCD4', '#795548',
    '#FFFFFF', '#9E9E9E', '#212121',
    '#F8BBD0', '#B3E5FC', '#C8E6C9',
]

const usedColorsList = ref<string[]>([])
const defaultPalette = ref<string[]>([])

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '')
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function colorDistance(a: string, b: string): number {
    const [r1, g1, b1] = hexToRgb(a)
    const [r2, g2, b2] = hexToRgb(b)
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

const colorModified = ref(false)

const similarColors = computed(() => {
    if (!usedColorsList.value.length || !form.color) return []
    const current = form.color.toUpperCase()
    return [...usedColorsList.value]
        .filter((c) => c.toUpperCase() !== current)
        .sort((a, b) => colorDistance(current, a) - colorDistance(current, b))
        .slice(0, 12)
})

const activePalette = computed(() =>
    colorModified.value && similarColors.value.length ? similarColors.value : defaultPalette.value
)

async function fetchUsedColors() {
    try {
        const records = await pb.collection('usedColors').getFullList<{ color: string }>({ fields: 'color' })
        usedColorsList.value = records.map((r) => r.color).filter(Boolean)
    } catch {
        usedColorsList.value = []
    }
}

function buildDefaultPalette() {
    const pool = usedColorsList.value.length ? usedColorsList.value : fallbackColors
    defaultPalette.value = [...pool].sort(() => Math.random() - 0.5).slice(0, 12)
}

const dialogOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const deleteDialog = ref(false)
const formRef = ref<VFormHandle>(null)
const setterItems = ref<string[]>([])
const editRouteId = ref<string | null>(null)
const originalAnchorPointIsZero = ref(false)

const form = reactive({
    name: '',
    combinedDifficulty: null as string | null,
    anchor_point: null as number | null,
    location: '',
    type: '',
    comment: '',
    creator: [] as string[],
    screw_date: '',
    color: '#FF5722',
    archived: false,
})

const isEditMode = computed(() => editRouteId.value !== null)
const isBoulderRoute = computed(() => form.type === 'Boulder')

const locations = ['Hanau', 'Gelnhausen']

const combinedDifficulties = Array.from({ length: 10 }, (_, i) => {
    const d = i + 1
    return [`${d} -`, String(d), `${d} +`]
}).flat()

const typeItems = computed(() => [
    { title: t('routes.types.route'), value: 'Route' },
    { title: t('routes.types.boulder'), value: 'Boulder' },
])

const requiredRule = required(t)

const nameRules = [
    (v: string) => !!v || t('validation.required'),
    (v: string) => v.length <= 30 || t('validation.maxLength', { n: 30 }),
]

const isAnchorPointValid = (value: number | null) => {
    if (value === null || value === undefined || String(value) === '')
        return false
    const n = Number(value)
    if (!Number.isInteger(n)) return false
    if (n === 0) return isBoulderRoute.value || originalAnchorPointIsZero.value
    return n >= 1 && n <= 100
}

const anchorPointRules = [
    (v: number | null) =>
        (v !== null && v !== undefined && String(v) !== '') ||
        t('validation.required'),
    (v: number | null) =>
        isAnchorPointValid(v) || t('validation.anchorPointRange'),
]

const creatorRule = (v: string[]) =>
    (Array.isArray(v) && v.length > 0) || t('validation.required')

const toCombinedDifficulty = (
    difficulty: RouteRecord['difficulty'],
    sign: RouteRecord['difficulty_sign'],
): string | null => {
    if (difficulty === null || difficulty === undefined) return null
    const d = String(difficulty)
    if (sign === true || sign === '+') return `${d} +`
    if (sign === false || sign === '-') return `${d} -`
    return d
}

const parseCombinedDifficulty = (
    combined: string | null,
): { difficulty: number | null; difficulty_sign: boolean | null } => {
    if (!combined) return { difficulty: null, difficulty_sign: null }
    if (combined.endsWith(' +'))
        return { difficulty: Number(combined.slice(0, -2)), difficulty_sign: true }
    if (combined.endsWith(' -'))
        return { difficulty: Number(combined.slice(0, -2)), difficulty_sign: false }
    return { difficulty: Number(combined), difficulty_sign: null }
}

const resetForm = () => {
    form.name = ''
    form.combinedDifficulty = null
    form.anchor_point = null
    form.location = ''
    form.type = ''
    form.comment = ''
    form.creator = []
    form.screw_date = ''
    form.color = '#FF5722'
    form.archived = false
    editRouteId.value = null
    originalAnchorPointIsZero.value = false
}

const loadFromRoute = (route: RouteRecord) => {
    editRouteId.value = route.id
    originalAnchorPointIsZero.value = Number(route.anchor_point) === 0

    form.name = route.name ?? ''
    form.combinedDifficulty = toCombinedDifficulty(route.difficulty, route.difficulty_sign)
    form.anchor_point = route.anchor_point ?? null
    form.location = route.location ?? ''
    form.type = route.type ?? ''
    form.comment = route.comment ?? ''
    form.creator = normalizeCreators(route.creator)
    form.screw_date = formatDateToYYYYMMDD(route.screw_date ?? null)
    form.color = route.color ?? '#FF5722'
    form.archived = route.archived ?? false
}

const getSetters = async () => {
    try {
        const records = await pb
            .collection('routes')
            .getFullList<RouteRecord>({ fields: 'creator', sort: '-created' })
        const creators = records.flatMap((r) => normalizeCreators(r.creator))
        setterItems.value = Array.from(new Set(creators.filter(Boolean)))
    } catch (error) {
        console.error('Failed to fetch route setters:', error)
    }
}

async function open(route?: RouteRecord) {
    resetForm()
    colorModified.value = false
    if (route) {
        loadFromRoute(route)
    }
    dialogOpen.value = true
    void getSetters()
    await fetchUsedColors()
    buildDefaultPalette()
    await nextTick()
    colorModified.value = false
}

function close() {
    dialogOpen.value = false
}

const emit = defineEmits<{
    saved: [payload: Partial<RouteRecord>]
    closed: []
    deleted: [id: string]
}>()

watch(dialogOpen, (val) => {
    if (!val) emit('closed')
})

watch(
    () => form.color,
    () => {
        if (dialogOpen.value) colorModified.value = true
    },
)

async function submit() {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (!valid) return

    saving.value = true
    try {
        const { difficulty, difficulty_sign } = parseCombinedDifficulty(form.combinedDifficulty)

        const payload: Partial<RouteRecord> = {
            name: form.name,
            difficulty: difficulty ?? undefined,
            difficulty_sign,
            anchor_point: form.anchor_point,
            location: form.location,
            type: form.type,
            comment: form.comment || '',
            creator: [...form.creator],
            screw_date: form.screw_date,
            color: form.color,
            archived: isEditMode.value ? Boolean(form.archived) : false,
        }

        if (isEditMode.value && editRouteId.value) {
            await pb.collection('routes').update(editRouteId.value, payload)
        } else {
            await pb.collection('routes').create(payload)
        }

        close()
        emit('saved', payload)
    } catch (error) {
        console.error('Failed to save route:', error)
    } finally {
        saving.value = false
    }
}

async function deleteRoute() {
    if (!editRouteId.value) return
    deleting.value = true
    try {
        await pb.collection('routes').delete(editRouteId.value)
        const id = editRouteId.value
        deleteDialog.value = false
        close()
        emit('deleted', id)
    } catch (error) {
        console.error('Failed to delete route:', error)
    } finally {
        deleting.value = false
    }
}

defineExpose({ open })
</script>

<style scoped>
.color-picker-section :deep(.v-color-picker) {
    box-shadow: none;
}

.color-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: box-shadow 0.15s;
}

.color-dot:hover {
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.3);
}
</style>
