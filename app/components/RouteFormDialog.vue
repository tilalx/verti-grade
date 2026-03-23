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

                    <v-row density="comfortable" class="mb-1">
                        <v-col cols="6">
                            <v-select
                                v-model="form.difficulty"
                                :label="$t('climbing.difficulty')"
                                :items="difficulties"
                                :rules="[requiredRule]"
                                required
                                density="comfortable"
                            />
                        </v-col>
                        <v-col cols="6">
                            <v-select
                                v-model="form.difficulty_sign"
                                :label="$t('climbing.difficulty_sign')"
                                :items="difficultySignItems"
                                item-title="title"
                                item-value="value"
                                density="comfortable"
                            />
                        </v-col>
                    </v-row>

                    <v-row density="comfortable" class="mb-1">
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
                        class="mb-1"
                    />

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

                    <v-text-field
                        v-model="form.screw_date"
                        :label="$t('routes.screwed_at')"
                        type="date"
                        :rules="[requiredRule]"
                        required
                        density="comfortable"
                        class="mb-1"
                    />

                    <v-textarea
                        v-model="form.comment"
                        :label="$t('climbing.comment')"
                        rows="2"
                        auto-grow
                        counter="255"
                        density="comfortable"
                        class="mb-2"
                    />

                    <v-switch
                        v-if="isEditMode"
                        v-model="form.archived"
                        :label="$t('climbing.archived')"
                        :true-value="true"
                        :false-value="false"
                        density="comfortable"
                        class="mb-2"
                    />

                    <div class="color-picker-section">
                        <v-color-picker
                            v-model="form.color"
                            show-swatches
                            hide-inputs
                            :swatches="colorSwatches"
                            swatches-max-height="140"
                            :modes="['hex']"
                            width="100%"
                            elevation="0"
                        />
                    </div>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-3">
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
type DifficultySignInternal = '' | '+' | '-'

const colorSwatches = [
    ['#F44336', '#FF9800', '#FFC107'], // red, orange, yellow
    ['#4CAF50', '#009688', '#2196F3'], // green, teal, blue
    ['#673AB7', '#E91E63', '#FF5722'], // purple, pink, deep orange
    ['#8BC34A', '#00BCD4', '#795548'], // lime, cyan, brown
    ['#FFFFFF', '#9E9E9E', '#212121'], // white, gray, black
    ['#F8BBD0', '#B3E5FC', '#C8E6C9'], // pastel pink, light blue, light green
]

const dialogOpen = ref(false)
const saving = ref(false)
const formRef = ref<VFormHandle>(null)
const setterItems = ref<string[]>([])
const editRouteId = ref<string | null>(null)
const originalAnchorPointIsZero = ref(false)

const form = reactive({
    name: '',
    difficulty: '',
    difficulty_sign: '' as DifficultySignInternal,
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

const difficulties = Array.from({ length: 10 }, (_, i) => String(i + 1))
const locations = ['Hanau', 'Gelnhausen']

const difficultySignItems = [
    { title: '—', value: '' },
    { title: '+', value: '+' },
    { title: '-', value: '-' },
]

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

const toDifficultySignInternal = (
    raw: RouteRecord['difficulty_sign'],
): DifficultySignInternal => {
    if (raw === true || raw === '+') return '+'
    if (raw === false || raw === '-') return '-'
    return ''
}

const resetForm = () => {
    form.name = ''
    form.difficulty = ''
    form.difficulty_sign = ''
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
    form.difficulty = String(route.difficulty ?? '')
    form.difficulty_sign = toDifficultySignInternal(route.difficulty_sign)
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

function open(route?: RouteRecord) {
    resetForm()
    if (route) {
        loadFromRoute(route)
    }
    dialogOpen.value = true
    void getSetters()
}

function close() {
    dialogOpen.value = false
}

const emit = defineEmits<{
    saved: [payload: Partial<RouteRecord>]
    closed: []
}>()

watch(dialogOpen, (val) => {
    if (!val) emit('closed')
})

async function submit() {
    if (!formRef.value) return
    const { valid } = await formRef.value.validate()
    if (!valid) return

    saving.value = true
    try {
        const signValue =
            form.difficulty_sign === '+'
                ? true
                : form.difficulty_sign === '-'
                  ? false
                  : null

        const payload: Partial<RouteRecord> = {
            name: form.name,
            difficulty: Number(form.difficulty),
            difficulty_sign: signValue,
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

defineExpose({ open })
</script>

<style scoped>
.color-picker-section :deep(.v-color-picker) {
    box-shadow: none;
}
</style>
