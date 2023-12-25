<template>
    <div class="create-review">
        <v-btn v-if="calltoaction" class="call-to-action" @click="openPopup" color="primary" size="large">
            <v-row align="center">
                <v-col cols="12">
                    <span class="call-to-action-text">Create a Review</span>
                </v-col>
            </v-row>
        </v-btn>
        <v-btn v-else @click="openPopup">{{ $t('ratings.createReview') }}</v-btn>
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
                            <v-select v-model="difficultySign" :label="$t('ratings.difficultySign')" :items="['', '+', '-']">
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

<script>
import { createRouteRating } from '@/services/routeRating';
export default {
    name: 'CreateReview',
    props: {
        routeId: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            showPopup: false,
            rating: null,
            difficulty: null,
            difficultySign: '',
            comment: '',
            ratings: [1, 2, 3, 4, 5],
            difficulties: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        };
    },
    computed: {
        isFormValid() {
            return this.rating && this.difficulty && this.comment;
        }
    },
    methods: {
        openPopup() {
            this.showPopup = true;
        },
        closePopup() {
            this.showPopup = false;
        },
        submitReview() {
            createRouteRating({
                routeId: this.routeId,
                rating: this.rating,
                difficulty: this.difficulty,
                difficultySign: this.difficultySign,
                comment: this.comment
            });
            this.closePopup();
        }
    }
};
</script>

