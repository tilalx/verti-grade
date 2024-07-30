<template>
    <div>
        <v-container>
            <v-row>
                <v-btn
                    color="primary"
                    @click="openPopup"
                    class="create-route-button"
                    >{{ $t('climbing.create') }}</v-btn
                >
                <v-dialog v-model="showPopup" persistent max-width="600px">
                    <v-card>
                        <v-card-text>
                            <v-container>
                                <v-form
                                    ref="form"
                                    @submit.prevent="createRoute"
                                >
                                    <v-text-field
                                        label="Name"
                                        v-model="routeName"
                                        :rules="nameRules"
                                        required
                                    ></v-text-field>

                                    <v-select
                                        label="Difficulty"
                                        :items="difficulties"
                                        v-model="routeDifficulty"
                                        required
                                    ></v-select>

                                    <v-select
                                        label="Difficulty + or -"
                                        :items="['', '+', '-']"
                                        v-model="routeDifficultySign"
                                    ></v-select>

                                    <v-select
                                        label="Location"
                                        :items="locations"
                                        v-model="routeLocation"
                                        required
                                    ></v-select>

                                    <v-select
                                        label="Type"
                                        :items="['Boulder', 'Route']"
                                        v-model="routeType"
                                        required
                                    ></v-select>

                                    <v-textarea
                                        label="Comment"
                                        v-model="routeComment"
                                        :counter="255"
                                    ></v-textarea>
                                    <v-combobox
                                        :label="$t('routes.route_setter')"
                                        multiple
                                        chips
                                        v-model="routeCreator"
                                        :items="setterItems"
                                        required
                                    ></v-combobox>
                                    <v-text-field
                                        v-model="routeScrewDate"
                                        label="Screw Date"
                                        type="date"
                                        required
                                    ></v-text-field>
                                    <div class="color-picker-container">
                                        <v-color-picker
                                            v-model="routeColor"
                                            :modes="['hexa']"
                                            label="Route Color"
                                            required
                                        ></v-color-picker>
                                    </div>
                                </v-form>
                            </v-container>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="blue darken-1"
                                text
                                @click="closePopup"
                                >{{ $t('actions.cancel') }}</v-btn
                            >
                            <v-btn
                                color="blue darken-1"
                                text
                                @click="validate"
                                :disabled="!isFormComplete"
                                >{{ $t('actions.create') }}</v-btn
                            >
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const pb = usePocketbase()

const showPopup = ref(false)
const routeName = ref('')
const routeDifficulty = ref('')
const routeDifficultySign = ref('')
const routeLocation = ref('')
const routeType = ref('')
const routeComment = ref('')
const routeCreator = ref([])
const routeScrewDate = ref('')
const routeColor = ref('')
const form = ref(null)
const setterItems = ref([])

const nameRules = [
    (v) => !!v || t('notifications.error.nameRequired'),
    (v) => v.length <= 30 || t('notifications.error.nameTooLong'),
]

const difficulties = Array.from({ length: 10 }, (_, i) => (i + 1).toString())
const locations = ['Hanau', 'Gelnhausen']

const isFormComplete = computed(
    () =>
        routeName.value &&
        routeDifficulty.value &&
        routeLocation.value &&
        routeType.value &&
        routeCreator.value &&
        routeScrewDate.value &&
        routeColor.value,
)

function openPopup() {
    showPopup.value = true
    getSetters()
}

function closePopup() {
    showPopup.value = false
}

function getSetters() {
    pb.collection('routes')
        .getFullList({
            fields: 'creator',
            sort: '-created',
        })
        .then((querySnapshot) => {
            const uniqueCreators = Array.from(
                new Set(querySnapshot.flatMap((doc) => doc.creator))
            );
            setterItems.value = uniqueCreators
        })

}

async function createRoute() {
    const routeData = {
        name: routeName.value,
        difficulty: routeDifficulty.value,
        difficulty_sign:
            routeDifficultySign.value === '+'
                ? true
                : routeDifficultySign.value === '-'
                  ? false
                  : null,
        location: routeLocation.value,
        type: routeType.value,
        comment: routeComment.value || '',
        creator: routeCreator.value || '',
        screw_date: routeScrewDate.value,
        color: routeColor.value,
    }

    try {
        await pb.collection('routes').create(routeData)

        showPopup.value = false
        form.value.reset()
    } catch (error) {
        console.error('Error creating route:', error)
    }
}

function validate() {
    if (isFormComplete.value) {
        createRoute()
    }
}
</script>

<style>
.color-picker-container {
    display: flex;
    justify-content: center;
    align-items: center; /* Optional, if you also want vertical centering */
    height: 100%; /* Adjust as needed */
}
</style>
