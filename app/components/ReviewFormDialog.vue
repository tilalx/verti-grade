<template>
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
                <span class="text-body-small font-weight-bold text-white">{{
                    initials(review.userName)
                }}</span>
            </v-avatar>
            <div>
                <div class="text-body-medium font-weight-medium">
                    {{ review.userName }}
                </div>
                <div class="text-body-small text-medium-emphasis">
                    {{ review.routeName }}
                </div>
            </div>
        </div>

        <v-form v-model="isFormValid">
            <!-- Stars and difficulty share a row from sm up -->
            <v-row density="comfortable" align="center" class="mb-1">
                <v-col cols="12" sm="6">
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
                <template #loader><CaptchaLoader /></template>
                {{ isEditMode ? $t('actions.save') : $t('actions.submit') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup>
import { required, nonBlank } from '~/utils/validation'
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: undefined,
    },
    routeId: {
        type: String,
        default: null,
    },
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
const { capHeaders } = useCapToken()

const isEditMode = computed(() => !!props.review)

// ── Open state ─────────────────────────────────────────────────────────────

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
            await pb.collection('ratings').create(
                {
                    route_id: props.routeId,
                    rating: form.rating,
                    difficulty,
                    difficulty_sign,
                    comment: form.comment?.trim(),
                },
                { headers: await capHeaders('rating') },
            )
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

.review-form__rating {
    min-height: 56px;
}
</style>
