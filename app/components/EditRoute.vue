<template>
    <div>
        <v-btn @click="openPopup">{{ $t('actions.edit') }}</v-btn>
        <v-dialog v-model="popupOpen" max-width="500px">
            <v-card>
                <v-card-text v-if="routeData">
                    <v-form @submit.prevent="saveChanges">
                        <v-text-field
                            v-model="routeData.name"
                            :label="$t('routes.name')"
                            required
                        ></v-text-field>
                        <v-select
                            v-model="routeData.difficulty"
                            :label="$t('climbing.difficulty')"
                            :items="difficulty"
                            required
                        ></v-select>
                        <v-select
                            v-model="routeData.difficulty_sign"
                            :label="$t('climbing.difficulty_sign')"
                            :items="difficulty_sign"
                            item-title="title"
                            item-value="value"
                            allow-numeric
                            required
                        ></v-select>
                        <v-select
                            v-model="routeData.location"
                            :label="$t('climbing.location')"
                            :items="locations"
                            required
                        ></v-select>
                        <v-select
                            v-model="routeData.type"
                            :label="$t('climbing.type')"
                            :items="Type"
                            item-title="title"
                            item-value="value"
                            required
                        ></v-select>
                        <v-textarea
                            v-model="routeData.comment"
                            :label="$t('climbing.comment')"
                        ></v-textarea>
                        <v-text-field
                            v-model="routeData.creator"
                            :label="$t('routes.creator_split')"
                            required
                        ></v-text-field>
                        <v-text-field
                            v-model="routeData.screw_date"
                            :label="$t('routes.screwed_at')"
                            type="date"
                            required
                        ></v-text-field>
                        <v-switch
                            v-model="routeData.archived"
                            :label="$t('climbing.archived')"
                            required
                            :true-value="true"
                            :false-value="false"
                        ></v-switch>
                        <div class="color-picker-container">
                            <v-color-picker
                                v-model="routeData.color"
                                :modes="['hexa']"
                                :label="$t('climbing.color')"
                                required
                            ></v-color-picker>
                        </div>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="closePopup">{{
                        $t('actions.cancel')
                    }}</v-btn>
                    <v-btn
                        color="primary"
                        type="submit"
                        @click="saveChanges"
                        :disabled="!isFormValid"
                        >{{ $t('actions.save') }}</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const { t } = useI18n()

const pb = usePocketbase()

const popupOpen = ref(false)
const routeData = ref(null)
const locations = ['Hanau', 'Gelnhausen']
const Type = reactive([
    { title: t('routes.types.route'), value: 'Route' },
    { title: t('routes.types.boulder'), value: 'Boulder' },
])

const difficulty_sign = reactive([
        { title: '', value: null },
        { title: '-', value: false },
        { title: '+', value: true }
    ])

const difficulty = Array.from({ length: 10 }, (_, i) => (i + 1).toString())

const props = defineProps({
    route_id: {
        type: String,
        required: true,
    },
})

function formatDateToYYYYMMDD(date) {
    if (!date) return null
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
}

const isFormValid = computed(() => {
    const data = routeData.value
    return (
        data &&
        data.name &&
        data.difficulty &&
        data.location &&
        data.type &&
        data.creator &&
        data.screw_date &&
        data.archived !== null &&
        data.color
    )
})

async function openPopup() {
    const response = await fetchClimbingRoute()
    response.screw_date = formatDateToYYYYMMDD(response.screw_date)
    response.creator = response.creator.join(',')
    routeData.value = response
    popupOpen.value = true
}

async function fetchClimbingRoute() {
    if (!props.route_id) {
        error.value = t('notifications.error.no_route_found')
        return
    }

    const record = await pb.collection('routes').getOne(props.route_id, {})

    if (!record) {
        error.value = t('notifications.error.no_route_found')
        return
    } else {
        return record
    }
}

function closePopup() {
    popupOpen.value = false
}

async function saveChanges() {
    if (isFormValid.value) {
        routeData.value.screw_date = formatDateToYYYYMMDD(
            routeData.value.screw_date,
        )
        routeData.value.creator = routeData.value.creator.split(',')

        await pb.collection('routes').update(routeData.value.id, {
            name: routeData.value.name,
            difficulty: routeData.value.difficulty,
            difficulty_sign: routeData.value.difficulty_sign,
            location: routeData.value.location,
            type: routeData.value.type,
            comment: routeData.value.comment,
            creator: routeData.value.creator,
            screw_date: routeData.value.screw_date,
            archived: routeData.value.archived,
            color: routeData.value.color,
        })
        closePopup()
    }
}
</script>

<style scoped>
.color-picker-container {
    display: flex;
    justify-content: center;
    align-items: center; /* Optional, if you also want vertical centering */
    height: 100%; /* Adjust as needed */
}
</style>
