<template>
    <LayoutDialogShell
        v-model="open"
        max-width="480"
        closable
        sheet-on-mobile
        :title="tick ? $t('ticks.edit') : $t('ticks.logAscent')"
        data-testid="tick-dialog"
    >
        <v-form ref="formRef" @submit.prevent="submit">
            <v-btn-toggle
                v-model="form.type"
                mandatory
                divided
                color="primary"
                variant="outlined"
                class="mb-4 w-100 tick-dialog__types"
            >
                <v-btn
                    v-for="type in TICK_TYPES"
                    :key="type"
                    :value="type"
                    class="flex-grow-1"
                    :data-testid="`tick-type-${type}`"
                >
                    {{ $t(`ticks.types.${type}`) }}
                </v-btn>
            </v-btn-toggle>

            <v-row density="comfortable">
                <v-col cols="6">
                    <v-text-field
                        v-model.number="form.attempts"
                        type="number"
                        :min="1"
                        :max="999"
                        :disabled="form.type === 'flash'"
                        :label="$t('ticks.attempts')"
                        :rules="[attemptsRule]"
                        prepend-inner-icon="mdi-counter"
                        data-testid="tick-attempts"
                    />
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        v-model="form.day"
                        type="date"
                        :max="today"
                        :label="$t('ticks.date')"
                        :rules="[required(t)]"
                        data-testid="tick-date"
                    />
                </v-col>
            </v-row>

            <v-textarea
                v-model="form.note"
                :label="$t('ticks.note')"
                :hint="$t('ticks.noteHint')"
                persistent-hint
                :counter="500"
                :maxlength="500"
                rows="2"
                auto-grow
                data-testid="tick-note"
            />
        </v-form>

        <template #actions>
            <v-btn variant="text" @click="open = false">
                {{ $t('actions.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn
                color="primary"
                :loading="saving"
                data-testid="tick-submit"
                @click="submit"
            >
                {{ $t('actions.save') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import type { TickRecord } from '~/types/models'
import { required } from '~/utils/validation'
import {
    TICK_TYPES,
    tickDate,
    tickDay,
    type TickType,
} from '#shared/utils/ticks'
import { formatDateToYYYYMMDD } from '#shared/utils/formatting'

const open = defineModel<boolean>({ default: false })

const props = withDefaults(
    defineProps<{
        routeId?: string | null
        tick?: TickRecord | null
    }>(),
    { routeId: null, tick: null },
)

const emit = defineEmits<{ saved: [tick: TickRecord] }>()

const pb = usePocketbase()
const { t } = useI18n()
const { notify, error: notifyError } = useNotification()

const formRef = useTemplateRef<VForm>('formRef')
const saving = ref(false)
const today = formatDateToYYYYMMDD(new Date().toISOString())

const form = reactive({
    type: 'top' as TickType,
    attempts: 1,
    day: today,
    note: '',
})

const attemptsRule = (value: number) =>
    (Number.isInteger(value) && value >= 1 && value <= 999) ||
    t('ticks.attemptsInvalid')

watch(open, (isOpen) => {
    if (!isOpen) return
    form.type = props.tick?.type ?? 'top'
    form.attempts = props.tick?.attempts ?? 1
    form.day = props.tick ? tickDay(props.tick.date) : today
    form.note = props.tick?.note ?? ''
})

watch(
    () => form.type,
    (type) => {
        if (type === 'flash') form.attempts = 1
    },
)

async function submit() {
    const { valid } = (await formRef.value?.validate()) ?? { valid: false }
    if (!valid) return
    saving.value = true
    const fields = {
        type: form.type,
        attempts: form.attempts,
        date: tickDate(form.day),
        note: form.note.trim(),
    }
    try {
        const saved = props.tick
            ? await pb
                  .collection('ticks')
                  .update<TickRecord>(props.tick.id, fields)
            : await pb.collection('ticks').create<TickRecord>({
                  ...fields,
                  user: pb.authStore.record?.id,
                  route: props.routeId,
              })
        notify(t('ticks.saved'))
        emit('saved', saved)
        open.value = false
    } catch (err) {
        console.error('Saving tick failed:', err)
        notifyError(t('ticks.saveError'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.tick-dialog__types {
    height: 44px;
}
</style>
