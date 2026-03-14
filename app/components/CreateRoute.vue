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

                                    <v-text-field
                                        :label="$t('climbing.anchor_point')"
                                        v-model.number="routeAnchorPoint"
                                        :rules="anchorPointRules"
                                        type="number"
                                        :min="isBoulderRoute ? 0 : 1"
                                        max="100"
                                        step="1"
                                        required
                                    ></v-text-field>

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

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type PocketBase from 'pocketbase'
import type { DifficultySignValue, RouteRecord } from '~/types/models'

const { t } = useI18n()

type DifficultySelectValue = '' | '+' | '-'
type VFormHandle = { reset: () => void } | null

const pb = usePocketbase() as PocketBase

const showPopup = ref(false)
const routeName = ref('')
const routeDifficulty = ref('')
const routeDifficultySign = ref<DifficultySelectValue>('')
const routeAnchorPoint = ref<number | null>(null)
const routeLocation = ref('')
const routeType = ref('')
const routeComment = ref('')
const routeCreator = ref<string[]>([])
const routeScrewDate = ref('')
const routeColor = ref('')
const form = ref<VFormHandle>(null)
const setterItems = ref<string[]>([])

const isBoulderRoute = computed(() => routeType.value === 'Boulder')

const isAnchorPointWithinRange = (value: number | string | null) => {
    const numeric = Number(value)

    if (!Number.isInteger(numeric)) {
        return false
    }

    const min = isBoulderRoute.value ? 0 : 1
    return numeric >= min && numeric <= 100
}

const nameRules: Array<(value: string) => true | string> = [
    (value) => (!!value ? true : t('notifications.error.nameRequired')),
    (value) => (value.length <= 30 ? true : t('notifications.error.nameTooLong')),
]

const anchorPointRules: Array<(value: number | string | null) => true | string> = [
    (value) => (value !== null && value !== undefined && value !== '' ? true : t('validation.required')),
    (value) => (isAnchorPointWithinRange(value) ? true : t('validation.anchorPointRange')),
]

const difficulties = Array.from({ length: 10 }, (_, index) => (index + 1).toString())
const locations = ['Hanau', 'Gelnhausen']

const isFormComplete = computed(() => {
    return (
        !!routeName.value &&
        !!routeDifficulty.value &&
        isAnchorPointWithinRange(routeAnchorPoint.value) &&
        !!routeLocation.value &&
        !!routeType.value &&
        routeCreator.value.length > 0 &&
        !!routeScrewDate.value &&
        !!routeColor.value
    )
})

function openPopup() {
    showPopup.value = true
    void getSetters()
}

function closePopup() {
    showPopup.value = false
}

async function getSetters() {
    try {
        const records = await pb
            .collection('routes')
            .getFullList<RouteRecord>({ fields: 'creator', sort: '-created' })

        const creators = records
            .flatMap((record) => normalizeCreators(record.creator))
            .filter(Boolean)

        setterItems.value = Array.from(new Set(creators))
    } catch (error) {
        console.error('Error loading route setters:', error)
    }
}

async function createRoute() {
    const signValue: DifficultySignValue =
        routeDifficultySign.value === '+'
            ? true
            : routeDifficultySign.value === '-'
                ? false
                : null

    const routeData: Partial<RouteRecord> = {
        name: routeName.value,
        difficulty: Number(routeDifficulty.value),
        difficulty_sign: signValue,
        anchor_point: routeAnchorPoint.value,
        location: routeLocation.value,
        type: routeType.value,
        comment: routeComment.value || '',
        creator: routeCreator.value,
        screw_date: routeScrewDate.value,
        color: routeColor.value,
        archived: false,
    }

    try {
        await pb.collection('routes').create(routeData)
        showPopup.value = false
        form.value?.reset()
        routeAnchorPoint.value = null
        routeCreator.value = []
    } catch (error) {
        console.error('Error creating route:', error)
    }
}

function validate() {
    if (isFormComplete.value) {
        void createRoute()
    }
}

function normalizeCreators(raw: RouteRecord['creator']): string[] {
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
</script>

<style>
.color-picker-container {
    display: flex;
    justify-content: center;
    align-items: center; /* Optional, if you also want vertical centering */
    height: 100%; /* Adjust as needed */
}
</style>
