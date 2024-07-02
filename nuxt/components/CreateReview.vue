<template>
    <div class="create-review">
        <v-btn v-if="calltoaction" class="call-to-action" @click="openPopup" color="primary" size="large" block >
            <v-row align="center">
                <v-col cols="12">
                    <span class="call-to-action-text">Create a Review</span>
                </v-col>
            </v-row>
        </v-btn>
        <v-btn v-else @click="openPopup">{{ $t('ratings.createReview') }}</v-btn>
        <v-divider class="mb-3"></v-divider>
        <v-dialog v-model="showPopup" max-width="500px">
            <v-card>
                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-select v-model="rating" :label="$t('ratings.stars')" :items="ratings" required>
                            </v-select>
                        </v-col>

                        <v-col cols="12" sm="6">
                            <v-select v-model="difficulty" :label="$t('ratings.difficulty')" :items="difficulties" required>
                            </v-select>
                        </v-col>

                        <v-col cols="12" sm="6">
                            <v-select v-model="difficulty_sign" :label="$t('ratings.difficulty_sign')" :items="['', '+', '-']">
                            </v-select>
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="comment" :label="$t('ratings.comment')"></v-textarea>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="closePopup">{{ $t('actions.cancel') }}</v-btn>
                    <v-btn @click="submitReview" :disabled="!isFormValid">{{ $t('actions.create') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  route_id: {
    type: String,
    required: true
  }
});

const supabase = useSupabaseClient();
const showPopup = ref(false);
const rating = ref(null);
const difficulty = ref(null);
const difficulty_sign = ref('');
const comment = ref('');
const ratings = ref([1, 2, 3, 4, 5]);
const difficulties = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
const calltoaction = ref(true);

const isFormValid = computed(() => {
  return rating.value && difficulty.value && comment.value;
});

function openPopup() {
  showPopup.value = true;
}

function closePopup() {
  showPopup.value = false;
  emit('closed');
}

async function createRouteRating(data) {
    const { error } = await supabase.from("ratings").insert(data);

    if (error) {
        console.error(error);
        return;
    }
}

function submitReview() {
  // Assuming createRouteRating is a global function or imported
  createRouteRating({
    route_id: props.route_id,
    rating: rating.value,
    difficulty: difficulty.value,
    difficulty_sign: difficulty_sign.value === '+' ? true : difficulty_sign.value === '-' ? false : null,
    comment: comment.value
  });
  closePopup();
}
</script>

