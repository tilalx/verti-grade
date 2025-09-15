<template>
    <div class="create-review-wrapper">
        <!-- 
            The main call-to-action button.
            Uses a larger, block-style button if `callToAction` is true.
        -->
        <v-btn 
            v-if="callToAction" 
            @click="isSheetOpen = true" 
            color="primary" 
            size="large" 
            block 
            prepend-icon="mdi-star-plus-outline"
        >
            {{ $t('ratings.createReview') }}
        </v-btn>
        
        <v-btn 
            v-else 
            @click="isSheetOpen = true" 
            variant="tonal"
        >
            {{ $t('ratings.createReview') }}
        </v-btn>

        <!-- 
            The v-bottom-sheet provides a native mobile experience by sliding up from the bottom.
            On desktop (screens wider than 600px), it behaves like a standard centered dialog.
        -->
        <v-bottom-sheet v-model="isSheetOpen" inset>
            <v-card class="py-2">
                <v-card-item class="text-center">
                    <v-card-title class="text-h5">
                        {{ $t('ratings.createReview') }}
                    </v-card-title>
                </v-card-item>

                <v-card-text>
                    <v-form v-model="isFormValid">
                        <v-row>
                            <!-- Star Rating: Using v-rating for a much more intuitive UI -->
                            <v-col cols="12">
                                <div class="d-flex flex-column align-center">
                                    <label for="star-rating" class="v-label mb-2">{{ $t('ratings.stars') }}</label>
                                    <v-rating
                                        id="star-rating"
                                        v-model="rating"
                                        :rules="[rules.required]"
                                        hover
                                        active-color="yellow-darken-2"
                                        color="grey-lighten-1"
                                        density="compact"
                                        size="x-large"
                                        clearable
                                    ></v-rating>
                                </div>
                            </v-col>

                            <!-- Combined Difficulty Selector -->
                            <v-col cols="12">
                                <v-select
                                    v-model="combinedDifficulty"
                                    :label="$t('ratings.difficulty')"
                                    :items="combinedDifficulties"
                                    :rules="[rules.required]"
                                    required
                                    variant="outlined"
                                    density="compact"
                                ></v-select>
                            </v-col>

                            <!-- Comment Textarea -->
                            <v-col cols="12">
                                <v-textarea
                                    v-model="comment"
                                    :label="$t('ratings.comment')"
                                    :rules="[rules.requiredAndNotEmpty]"
                                    variant="outlined"
                                    rows="5"
                                    auto-grow
                                    density="compact"
                                ></v-textarea>
                            </v-col>
                        </v-row>
                    </v-form>
                </v-card-text>

                <v-card-actions class="px-4 pb-4">
                    <v-btn @click="closeSheet" variant="text">{{ $t('actions.cancel') }}</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn 
                        @click="submitReview" 
                        :disabled="!isFormValid" 
                        color="primary"
                        variant="flat"
                        size="large"
                    >
                        {{ $t('actions.submit') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-bottom-sheet>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const props = defineProps({
    route_id: {
        type: String,
        required: true,
    },
    callToAction: {
        type: Boolean,
        default: false,
    },
})

const pb = usePocketbase()
const { t } = useI18n()

// Component State
const isSheetOpen = ref(false)
const isFormValid = ref(false)

// Form Fields
const rating = ref(null)
const combinedDifficulty = ref(null) // Holds the combined value, e.g., "7 -"
const comment = ref('')

// Generate the list of combined difficulties in a logical order with spaces
const combinedDifficulties = computed(() => {
    const difficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = [];
    difficulties.forEach(d => {
        result.push(
            `${d} -`,
            String(d),
            `${d} +`,
        );
    });
    return result;
});

// Validation rules
const rules = reactive({
    required: value => (value !== null && value !== '') || t('validation.required'),
    requiredAndNotEmpty: value => (value && value.trim() !== '') || t('validation.required'),
})

// --- Methods ---

function closeSheet() {
    isSheetOpen.value = false
}

function resetForm() {
    rating.value = null
    combinedDifficulty.value = null
    comment.value = ''
    // Force validation to reset
    isFormValid.value = false
}

async function submitReview() {
    if (!isFormValid.value) return

    // Split the combinedDifficulty value for the API
    const difficultyString = combinedDifficulty.value.trim();
    const difficultyNumber = parseInt(difficultyString, 10);
    const sign = difficultyString.slice(-1); // Gets the last character

    let signValue = null;
    if (sign === '+') {
        signValue = true;
    } else if (sign === '-') {
        signValue = false;
    }

    try {
        const data = {
            route_id: props.route_id,
            rating: rating.value,
            difficulty: difficultyNumber,
            difficulty_sign: signValue,
            comment: comment.value.trim(),
        }

        await pb.collection('ratings').create(data)

    } catch (error) {
        console.error("Failed to submit review:", error)
    } finally {
        closeSheet()
        resetForm()
    }
}
</script>

<style scoped>

</style>