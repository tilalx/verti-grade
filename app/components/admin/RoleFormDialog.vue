<template>
    <LayoutDialogShell
        v-model="dialog"
        :title="isEdit ? t('permissions.editRole') : t('permissions.addRole')"
        :persistent="hasChanges"
        sheet-on-mobile
        closable
        data-testid="role-form-dialog"
    >
        <v-form ref="form" v-model="valid">
            <v-text-field
                v-model="draft.name"
                :rules="nameRules"
                :error-messages="nameError ? [nameError] : []"
                :label="t('permissions.roleName')"
                :readonly="nameLocked"
                :hint="nameLocked ? t('permissions.adminRoleLocked') : ''"
                :persistent-hint="nameLocked"
                prepend-inner-icon="mdi-shield-account-outline"
                class="mb-1"
                data-testid="role-form-name"
                @update:model-value="nameError = ''"
            />

            <v-text-field
                v-model="draft.description"
                :rules="descriptionRules"
                :label="t('permissions.roleDescription')"
                prepend-inner-icon="mdi-text-short"
                data-testid="role-form-description"
            />

            <div class="text-body-small text-medium-emphasis mb-2">
                {{ t('permissions.roleColor') }}
            </div>

            <div class="d-flex flex-wrap ga-2 align-center">
                <button
                    v-for="c in ROLE_COLORS"
                    :key="c"
                    type="button"
                    class="color-dot"
                    :aria-label="c"
                    :aria-pressed="isSelected(c)"
                    :style="{
                        backgroundColor: c,
                        boxShadow: isSelected(c)
                            ? '0 0 0 2px rgb(var(--v-theme-surface)), 0 0 0 4px ' +
                              c
                            : 'none',
                    }"
                    :data-testid="`role-form-swatch-${c.slice(1)}`"
                    @click="pickSwatch(c)"
                />

                <v-btn
                    :variant="customOpen ? 'tonal' : 'text'"
                    size="small"
                    prepend-icon="mdi-eyedropper-variant"
                    data-testid="role-form-color-custom"
                    @click="toggleCustom"
                >
                    {{ t('permissions.customColor') }}
                </v-btn>
            </div>

            <div v-if="customOpen" class="color-picker-section mt-3">
                <v-color-picker
                    v-model="draft.color"
                    hide-inputs
                    :modes="['hex']"
                    width="100%"
                    elevation="0"
                />
            </div>

            <div class="mt-4">
                <div class="text-body-small text-medium-emphasis mb-1">
                    {{ t('permissions.preview') }}
                </div>
                <v-chip
                    size="small"
                    :color="draft.color || undefined"
                    :variant="draft.color ? 'flat' : 'tonal'"
                    :style="
                        draft.color
                            ? { color: readableTextOn(draft.color) }
                            : undefined
                    "
                    data-testid="role-form-preview"
                >
                    {{ draft.name || t('permissions.roleName') }}
                </v-chip>
            </div>
        </v-form>

        <template #actions>
            <v-btn variant="text" data-testid="role-form-cancel" @click="close">
                {{ t('actions.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn
                :disabled="!valid || !hasChanges"
                :loading="saving"
                color="primary"
                prepend-icon="mdi-check"
                data-testid="role-form-submit"
                @click="save"
            >
                {{ isEdit ? t('actions.save') : t('permissions.createRole') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>

<script setup lang="ts">
import type { ClientResponseError } from 'pocketbase'
import type { VForm } from 'vuetify/components'
import { required, maxLength } from '~/utils/validation'
import type { RoleRecord } from '~/types/models'
import { toHex6, isProtectedRole, readableTextOn } from '~/utils/roles'

const ROLE_COLORS = [
    '#EF5350',
    '#EC407A',
    '#AB47BC',
    '#7C4DFF',
    '#5C6BC0',
    '#42A5F5',
    '#26A69A',
    '#66BB6A',
    '#9CCC65',
    '#FFA726',
    '#8D6E63',
    '#78909C',
]

const props = withDefaults(
    defineProps<{ role?: Partial<RoleRecord> | null }>(),
    { role: null },
)

const emit = defineEmits<{
    saved: [action: 'updated' | 'created']
    close: []
}>()

const { t } = useI18n()
const pb = usePocketbase()
const { error: notifyError } = useNotification()

const dialog = ref(false)
const form = ref<VForm | null>(null)
const valid = ref(false)
const saving = ref(false)
const customOpen = ref(false)
const nameError = ref('')

const draft = reactive({ name: '', description: '', color: '' })
const original = reactive({ name: '', description: '', color: '' })

const isEdit = computed(() => !!props.role?.id)

const nameLocked = computed(
    () => isEdit.value && isProtectedRole({ name: props.role?.name ?? '' }),
)

const nameRules = [required(t), maxLength(t, 50)]
const descriptionRules = [maxLength(t, 200)]

const hasChanges = computed(
    () =>
        draft.name !== original.name ||
        draft.description !== original.description ||
        draft.color !== original.color,
)

function isSelected(hex: string) {
    return toHex6(draft.color) === toHex6(hex)
}

function pickSwatch(hex: string) {
    draft.color = hex
    customOpen.value = false
}

function toggleCustom() {
    if (!customOpen.value && !draft.color) draft.color = ROLE_COLORS[0]!
    customOpen.value = !customOpen.value
}

watch(
    () => props.role,
    (role) => {
        if (!role) {
            dialog.value = false
            return
        }
        Object.assign(draft, {
            name: role.name ?? '',
            description: role.description ?? '',
            color: toHex6(role.color),
        })
        Object.assign(original, { ...draft })
        nameError.value = ''
        customOpen.value =
            !!draft.color && !ROLE_COLORS.some((c) => isSelected(c))
        dialog.value = true
    },
    { immediate: true },
)

watch(dialog, (open) => {
    if (!open) emit('close')
})

function close() {
    dialog.value = false
}

async function save() {
    const result = await form.value?.validate()
    if (!result?.valid) return

    const payload = {
        name: nameLocked.value ? (props.role?.name ?? '') : draft.name.trim(),
        description: draft.description.trim(),
        color: toHex6(draft.color),
    }

    saving.value = true
    try {
        if (isEdit.value) {
            await pb.collection('roles').update(props.role!.id!, payload)
        } else {
            await pb.collection('roles').create(payload)
        }
        emit('saved', isEdit.value ? 'updated' : 'created')
        close()
    } catch (err) {
        if ((err as ClientResponseError)?.response?.data?.name) {
            nameError.value = t('permissions.nameTaken')
            return
        }
        console.error('Failed to save role:', err)
        notifyError(t('permissions.roleSaveError'))
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.color-picker-section :deep(.v-color-picker) {
    box-shadow: none;
}

.color-dot {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: box-shadow 0.15s;
}

.color-dot:hover {
    box-shadow: 0 0 0 2px rgba(128, 128, 128, 0.5);
}
</style>
