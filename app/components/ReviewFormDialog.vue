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
                    nameInitials(review.userName)
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
                        v-model="form.grade"
                        :label="`${$t('ratings.difficulty')} (${$t(`gradeSystems.${gradeSystem}`)})`"
                        :items="gradeLabels(gradeSystem)"
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

<script setup lang="ts">
import { required, nonBlank } from '~/utils/validation'
import {
    DEFAULT_ROUTE_GRADE_SYSTEM,
    gradeIndex,
    gradeLabels,
    isGradeSystem,
} from '#shared/utils/grades'
import type { RatingRecord } from '~/types/models'
import { avatarColor, nameInitials } from '~/utils/avatar'

type EditableReview = RatingRecord & { userName?: string; routeName?: string }

const props = withDefaults(
    defineProps<{
        modelValue?: boolean
        routeId?: string | null
        gradeSystem?: string | null
        review?: EditableReview | null
        callToAction?: boolean
    }>(),
    {
        modelValue: undefined,
        routeId: null,
        gradeSystem: null,
        review: null,
        callToAction: false,
    },
)

const emit = defineEmits<{
    'update:modelValue': [open: boolean]
    saved: [rating: RatingRecord | null]
}>()

const pb = usePocketbase()
const { t } = useI18n()
const { error: notifyError } = useNotification()
const { capHeaders } = useCapToken()

const isEditMode = computed(() => !!props.review)

const gradeSystem = computed(() => {
    const system = props.review?.grade_system || props.gradeSystem
    return isGradeSystem(system) ? system : DEFAULT_ROUTE_GRADE_SYSTEM
})

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
    rating: undefined as number | undefined,
    grade: null as string | null,
    comment: '',
})

const rules = {
    required: required(t),
    requiredAndNotEmpty: nonBlank(t),
}

watch(
    () => props.review,
    (review) => {
        if (review) {
            form.rating = review.rating ?? undefined
            form.grade = review.grade || null
            form.comment = review.comment ?? ''
        }
    },
    { immediate: true },
)

watch(sheetOpen, (open) => {
    if (open) {
        if (props.review) {
            form.rating = props.review.rating ?? undefined
            form.grade = props.review.grade || null
            form.comment = props.review.comment ?? ''
        } else {
            resetForm()
        }
    } else if (!isEditMode.value) {
        resetForm()
    }
})

// ── Helpers ────────────────────────────────────────────────────────────────

function resetForm() {
    form.rating = undefined
    form.grade = null
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
        const grading = {
            grade: form.grade ?? '',
            grade_system: gradeSystem.value,
            grade_index: gradeIndex(gradeSystem.value, form.grade),
        }

        if (isEditMode.value) {
            const updated = await pb
                .collection('ratings')
                .update<RatingRecord>(props.review!.id, {
                    rating: form.rating,
                    ...grading,
                    comment: form.comment,
                })
            emit('saved', updated)
        } else {
            await pb.collection('ratings').create(
                {
                    route_id: props.routeId,
                    rating: form.rating,
                    ...grading,
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
