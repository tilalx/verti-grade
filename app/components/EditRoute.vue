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
                        <v-text-field
                            v-model.number="routeData.anchor_point"
                            :label="$t('climbing.anchor_point')"
                            :rules="anchorPointRules"
                            type="number"
                            :min="isBoulderRoute ? 0 : 1"
                            max="100"
                            step="1"
                            required
                        ></v-text-field>
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
                        <v-combobox
                            :label="$t('routes.route_setter')"
                            multiple
                            chips
                            v-model="routeData.creator"
                            :items="setterItems"
                            required
                        ></v-combobox>
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
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePocketbase } from '@/composables/pocketbase.js'

const props = defineProps({
    route: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['closed', 'saved'])

const { t } = useI18n()
const pb = usePocketbase()

const popupOpen = ref(false)
const routeData = ref(null)
const setterItems = ref([])
const originalAnchorPointIsZero = ref(false)

const locations = ['Hanau', 'Gelnhausen']
const Type = reactive([
    { title: t('routes.types.route'), value: 'Route' },
    { title: t('routes.types.boulder'), value: 'Boulder' },
])

const difficulty_sign = reactive([
    { title: '', value: null },
    { title: '-', value: false },
    { title: '+', value: true },
])

const difficulty = Array.from({ length: 10 }, (_, i) => (i + 1).toString())

const isBoulderRoute = computed(() => routeData.value?.type === 'Boulder')

const isAnchorPointAllowed = (value) => {
    const numeric = Number(value)

    if (!Number.isInteger(numeric)) {
        return false
    }

    if (numeric === 0) {
        return isBoulderRoute.value || originalAnchorPointIsZero.value
    }

    return numeric >= 1 && numeric <= 100
}

const anchorPointRules = [
    (v) => (v !== null && v !== undefined && v !== '') || t('validation.required'),
    (v) => (isAnchorPointAllowed(v) ? true : t('validation.anchorPointRange')),
]

const isFormValid = computed(() => {
    const data = routeData.value
    if (!data) {
        return false
    }

    return (
        Boolean(data.name) &&
        Boolean(data.difficulty) &&
        isAnchorPointAllowed(data.anchor_point) &&
        Boolean(data.location) &&
        Boolean(data.type) &&
        Array.isArray(data.creator) &&
        data.creator.length > 0 &&
        Boolean(data.screw_date) &&
        data.archived !== null &&
        Boolean(data.color)
    )
})

const normalizeCreators = (raw) => {
    if (Array.isArray(raw)) {
        return raw
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter(Boolean)
    }

    if (typeof raw === 'string') {
        return raw
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    }

    return []
}

const formatDateToYYYYMMDD = (date) => {
    if (!date) {
        return null
    }

    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) {
        return null
    }

    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const day = String(parsed.getDate()).padStart(2, '0')
    const year = parsed.getFullYear()

    return `${year}-${month}-${day}`
}

const toEditableRoute = (route) => {
    if (!route) {
        return null
    }

    const clone = JSON.parse(JSON.stringify(route))

    return {
        ...clone,
        anchor_point: clone.anchor_point ?? '',
        creator: normalizeCreators(clone.creator),
        screw_date: formatDateToYYYYMMDD(clone.screw_date),
        archived: clone.archived ?? false,
    }
}

const getSetters = async () => {
    try {
        const querySnapshot = await pb.collection('routes').getFullList({
            fields: 'creator',
            sort: '-created',
        })

        const uniqueCreators = new Set()
        querySnapshot.forEach((doc) => {
            normalizeCreators(doc?.creator).forEach((creator) => uniqueCreators.add(creator))
        })

        setterItems.value = Array.from(uniqueCreators)
    } catch (error) {
        console.error('Failed to fetch route setters:', error)
        setterItems.value = []
    }
}

async function openPopup() {
    if (!props.route?.id) {
        console.error('EditRoute: Missing route id, cannot open editor.')
        return
    }

    routeData.value = toEditableRoute(props.route)
    originalAnchorPointIsZero.value = Number(props.route.anchor_point) === 0
    popupOpen.value = true
    await getSetters()
}

function closePopup() {
    popupOpen.value = false
}

async function saveChanges() {
    if (!isFormValid.value || !routeData.value) {
        return
    }

    const payload = {
        name: routeData.value.name,
        difficulty: routeData.value.difficulty,
        difficulty_sign: routeData.value.difficulty_sign,
        anchor_point: Number(routeData.value.anchor_point),
        location: routeData.value.location,
        type: routeData.value.type,
        comment: routeData.value.comment,
        creator: normalizeCreators(routeData.value.creator),
        screw_date: routeData.value.screw_date,
        archived: Boolean(routeData.value.archived),
        color: routeData.value.color,
    }

    try {
        await pb.collection('routes').update(routeData.value.id, payload)
        closePopup()
        emit('saved', payload)
        emit('closed')
    } catch (error) {
        console.error('Failed to update route:', error)
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
