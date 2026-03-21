<template>
    <!-- Trigger button: only when parent does NOT control open state via v-model -->
    <template v-if="modelValue === undefined">
        <v-btn
            v-if="callToAction"
            color="primary"
            size="large"
            block
            rounded="xl"
            prepend-icon="mdi-star-plus-outline"
            @click="internalOpen = true"
        >
            {{ $t('ratings.createReview') }}
        </v-btn>
        <v-btn v-else variant="tonal" @click="internalOpen = true">
            {{ $t('ratings.createReview') }}
        </v-btn>
    </template>

    <v-bottom-sheet v-model="sheetOpen" inset>
        <v-card class="py-2">
            <v-toolbar color="transparent" flat density="compact" class="pt-1">
                <v-toolbar-title class="text-body-1 font-weight-semibold pl-2">
                    {{ isEditMode ? $t('comments.editReview') : $t('ratings.createReview') }}
                </v-toolbar-title>
                <v-btn icon variant="text" @click="close">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-card-text>
                <!-- Context row: shown only in edit mode -->
                <div v-if="isEditMode && review" class="d-flex align-center ga-3 mb-5 pa-3 rounded-lg bg-surface-variant">
                    <v-avatar size="30" :color="avatarColor(review.userName)">
                        <span class="text-caption font-weight-bold text-white">{{ initials(review.userName) }}</span>
                    </v-avatar>
                    <div>
                        <div class="text-body-2 font-weight-medium">{{ review.userName }}</div>
                        <div class="text-caption text-medium-emphasis">{{ review.routeName }}</div>
                    </div>
                </div>

                <v-form v-model="isFormValid">
                    <v-row>
                        <!-- Star rating -->
                        <v-col cols="12">
                            <div class="d-flex flex-column align-center">
                                <label class="v-label mb-2">{{ $t('ratings.stars') }}</label>
                                <v-rating
                                    v-model="form.rating"
                                    :rules="isEditMode ? [] : [rules.required]"
                                    hover
                                    active-color="yellow-darken-2"
                                    color="grey-lighten-1"
                                    density="compact"
                                    size="x-large"
                                    clearable
                                />
                            </div>
                        </v-col>

                        <!-- Combined difficulty -->
                        <v-col cols="12">
                            <v-select
                                v-model="form.combinedDifficulty"
                                :label="$t('ratings.difficulty')"
                                :items="combinedDifficulties"
                                :rules="isEditMode ? [] : [rules.required]"
                                clearable
                                variant="outlined"
                                density="compact"
                            />
                        </v-col>

                        <!-- Comment -->
                        <v-col cols="12">
                            <v-textarea
                                v-model="form.comment"
                                :label="$t('ratings.comment')"
                                :rules="isEditMode ? [] : [rules.requiredAndNotEmpty]"
                                variant="outlined"
                                rows="4"
                                auto-grow
                                density="compact"
                                :counter="isEditMode ? 1000 : undefined"
                            />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" @click="close">{{ $t('actions.cancel') }}</v-btn>
                <v-spacer />
                <v-btn
                    :disabled="!isEditMode && !isFormValid"
                    :loading="saving"
                    color="primary"
                    variant="flat"
                    size="large"
                    @click="submit"
                >
                    {{ isEditMode ? $t('actions.save') : $t('actions.submit') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-bottom-sheet>
</template>

<script setup>

const props = defineProps({
    // Controls open state externally (edit mode)
    modelValue: {
        type: Boolean,
        default: undefined,
    },
    // route_id is required when creating
    routeId: {
        type: String,
        default: null,
    },
    // Passing a review switches to edit mode
    review: {
        type: Object,
        default: null,
    },
    callToAction: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const pb = usePocketbase()
const { t } = useI18n()

const isEditMode = computed(() => !!props.review)

// ── Open state ─────────────────────────────────────────────────────────────
// Internal open for create mode; external v-model for edit mode.

const internalOpen = ref(false)

const sheetOpen = computed({
    get() {
        return props.modelValue !== undefined ? props.modelValue : internalOpen.value
    },
    set(val) {
        if (props.modelValue !== undefined) {
            emit('update:modelValue', val)
        } else {
            internalOpen.value = val
        }
    },
})

// ── Form state ─────────────────────────────────────────────────────────────

const isFormValid = ref(false)
const saving = ref(false)

const form = reactive({
    rating: null,
    combinedDifficulty: null,
    comment: '',
})

const combinedDifficulties = computed(() => {
    const result = []
    for (let d = 1; d <= 10; d++) {
        result.push(`${d} -`, String(d), `${d} +`)
    }
    return result
})

const rules = {
    required: (v) => (v !== null && v !== '') || t('validation.required'),
    requiredAndNotEmpty: (v) => (v && v.trim() !== '') || t('validation.required'),
}

// Pre-fill form when review prop changes (edit mode)
watch(
    () => props.review,
    (review) => {
        if (review) {
            form.rating = review.rating
            form.combinedDifficulty = toCombined(review.difficulty, review.difficulty_sign)
            form.comment = review.comment ?? ''
        }
    },
    { immediate: true },
)

// Reset form when create-mode sheet closes
watch(sheetOpen, (open) => {
    if (!open && !isEditMode.value) resetForm()
})

// ── Helpers ────────────────────────────────────────────────────────────────

function toCombined(difficulty, sign) {
    if (difficulty === null || difficulty === undefined) return null
    const suffix = sign === true ? ' +' : sign === false ? ' -' : ''
    return `${difficulty}${suffix}`
}

function fromCombined(combined) {
    if (!combined) return { difficulty: null, difficulty_sign: null }
    const num = parseInt(combined, 10)
    const trimmed = combined.trim()
    const sign = trimmed.endsWith('+') ? true : trimmed.endsWith('-') ? false : null
    return { difficulty: Number.isNaN(num) ? null : num, difficulty_sign: sign }
}

const AVATAR_COLORS = [
    'primary', 'secondary', 'success', 'info', 'deep-purple',
    'teal', 'indigo', 'pink', 'cyan', 'orange',
]

function avatarColor(name) {
    if (!name) return 'primary'
    const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

function initials(name) {
    if (!name) return '?'
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('')
}

function resetForm() {
    form.rating = null
    form.combinedDifficulty = null
    form.comment = ''
    isFormValid.value = false
}

function close() {
    sheetOpen.value = false
}

// ── Submit ─────────────────────────────────────────────────────────────────

async function submit() {
    saving.value = true
    try {
        const { difficulty, difficulty_sign } = fromCombined(form.combinedDifficulty)

        if (isEditMode.value) {
            const updated = await pb.collection('ratings').update(props.review.id, {
                rating: form.rating,
                difficulty,
                difficulty_sign,
                comment: form.comment,
            })
            emit('saved', updated)
        } else {
            await pb.collection('ratings').create({
                route_id: props.routeId,
                rating: form.rating,
                difficulty,
                difficulty_sign,
                comment: form.comment?.trim(),
            })
            emit('saved', null)
        }

        close()
    } catch (err) {
        console.error('Failed to save review:', err)
    } finally {
        saving.value = false
    }
}
</script>
