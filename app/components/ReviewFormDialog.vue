<template>
    <!-- Trigger button: only when parent does NOT control open state via v-model -->
    <template v-if="modelValue === undefined">
        <v-btn
            v-if="callToAction"
            color="primary"
            size="large"
            block
            prepend-icon="mdi-star-plus-outline"
            data-testid="review-open-cta"
            @click="internalOpen = true"
        >
            {{ $t('ratings.createReview') }}
        </v-btn>
        <v-btn
            v-else
            variant="tonal"
            data-testid="review-open"
            @click="internalOpen = true"
        >
            {{ $t('ratings.createReview') }}
        </v-btn>
    </template>

    <LayoutDialogShell
        v-model="sheetOpen"
        max-width="600"
        closable
        sheet-on-mobile
        :title="
            isEditMode ? $t('comments.editReview') : $t('ratings.createReview')
        "
        data-testid="review-form-dialog"
    >
        <!-- Context row: shown only in edit mode -->
        <div
            v-if="isEditMode && review"
            class="d-flex align-center ga-3 mb-4 pa-3 rounded-lg review-form__context"
        >
            <v-avatar size="30" :color="avatarColor(review.userName)">
                <span class="text-caption font-weight-bold text-white">{{
                    initials(review.userName)
                }}</span>
            </v-avatar>
            <div>
                <div class="text-body-2 font-weight-medium">
                    {{ review.userName }}
                </div>
                <div class="text-caption text-medium-emphasis">
                    {{ review.routeName }}
                </div>
            </div>
        </div>

        <v-form v-model="isFormValid">
            <!-- Stars and difficulty share a row from sm up -->
            <v-row density="comfortable" align="center" class="mb-1">
                <v-col cols="12" sm="6">
                    <!-- Inline label, field-height box: keeps the stars on the
                         same baseline as the select next to it. -->
                    <div class="d-flex align-center ga-3 review-form__rating">
                        <span class="v-label">{{ $t('ratings.stars') }}</span>
                        <v-rating
                            v-model="form.rating"
                            :rules="isEditMode ? [] : [rules.required]"
                            hover
                            active-color="yellow-darken-2"
                            color="grey-lighten-1"
                            density="compact"
                            size="default"
                            clearable
                            data-testid="review-form-rating"
                        />
                    </div>
                </v-col>

                <v-col cols="12" sm="6">
                    <v-select
                        v-model="form.combinedDifficulty"
                        :label="$t('ratings.difficulty')"
                        :items="combinedDifficulties"
                        :rules="isEditMode ? [] : [rules.required]"
                        clearable
                        hide-details="auto"
                        data-testid="review-form-difficulty"
                    />
                </v-col>
            </v-row>

            <v-textarea
                v-model="form.comment"
                :label="$t('ratings.comment')"
                :rules="isEditMode ? [] : [rules.requiredAndNotEmpty]"
                rows="6"
                auto-grow
                :counter="isEditMode ? 1000 : undefined"
                data-testid="review-form-comment"
            />
        </v-form>

        <template #actions>
            <v-btn
                variant="text"
                data-testid="review-form-cancel"
                @click="close"
                >{{ $t('actions.cancel') }}</v-btn
            >
            <v-spacer />
            <v-btn
                :disabled="!isEditMode && !isFormValid"
                :loading="saving"
                color="primary"
                data-testid="review-form-submit"
                @click="submit"
            >
                {{ isEditMode ? $t('actions.save') : $t('actions.submit') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup>
import { required, nonBlank } from '~/utils/validation'
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
const { error: notifyError } = useNotification()

const isEditMode = computed(() => !!props.review)

// ── Open state ─────────────────────────────────────────────────────────────
// Internal open for create mode; external v-model for edit mode.

const internalOpen = ref(false)

const sheetOpen = computed({
    get() {
        return props.modelValue !== undefined
            ? props.modelValue
            : internalOpen.value
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
    required: required(t),
    requiredAndNotEmpty: nonBlank(t),
}

// Pre-fill form when review prop changes (edit mode)
watch(
    () => props.review,
    (review) => {
        if (review) {
            form.rating = review.rating
            form.combinedDifficulty = toCombined(
                review.difficulty,
                review.difficulty_sign,
            )
            form.comment = review.comment ?? ''
        }
    },
    { immediate: true },
)

// Re-sync the form every time the sheet opens, so a cancelled edit never
// survives into the next time the same record is reopened (props.review's
// object reference doesn't change on reopen, so the watch above alone
// wouldn't refire).
watch(sheetOpen, (open) => {
    if (open) {
        if (props.review) {
            form.rating = props.review.rating
            form.combinedDifficulty = toCombined(
                props.review.difficulty,
                props.review.difficulty_sign,
            )
            form.comment = props.review.comment ?? ''
        } else {
            resetForm()
        }
    } else if (!isEditMode.value) {
        resetForm()
    }
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
    const sign = trimmed.endsWith('+')
        ? true
        : trimmed.endsWith('-')
          ? false
          : null
    return { difficulty: Number.isNaN(num) ? null : num, difficulty_sign: sign }
}

const AVATAR_COLORS = [
    'primary',
    'secondary',
    'success',
    'info',
    'deep-purple',
    'teal',
    'indigo',
    'pink',
    'cyan',
    'orange',
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
        const { difficulty, difficulty_sign } = fromCombined(
            form.combinedDifficulty,
        )

        if (isEditMode.value) {
            const updated = await pb
                .collection('ratings')
                .update(props.review.id, {
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
        notifyError(t('notifications.error.generic'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.review-form__context {
    background: rgba(var(--v-theme-on-surface), 0.06);
}

/* Matches the default-density field height next to it. */
.review-form__rating {
    min-height: 56px;
}
</style>
