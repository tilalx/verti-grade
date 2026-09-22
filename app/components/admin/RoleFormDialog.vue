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

            <!-- Swatches first: they are the whole answer for almost every
                 role, and they are the only colors guaranteed to stay legible
                 as a chip in both themes. -->
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

<script setup>
import { required, maxLength } from '~/utils/validation'
import { toHex6, isProtectedRole, readableTextOn } from '~/utils/roles'

// A dozen mid-tone hues: dark enough to read on a light chip, light enough to
// read on a dark one, which a free-form picker cannot promise.
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

const props = defineProps({
    /**
     * The role being edited, a blank object for a new one, or `null` to close.
     * Mirrors the prop-watch convention in `user/EditUser.vue`.
     */
    role: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'close'])

const { t } = useI18n()
const pb = usePocketbase()
const { error: notifyError } = useNotification()

const dialog = ref(false)
const form = ref(null)
const valid = ref(false)
const saving = ref(false)
const customOpen = ref(false)
const nameError = ref('')

const draft = reactive({ name: '', description: '', color: '' })
const original = reactive({ name: '', description: '', color: '' })

const isEdit = computed(() => !!props.role?.id)

/**
 * Renaming the admin role would silently disarm two guards at once: the
 * client-side safety net in `usePermissions.can()` and the `name != "admin"`
 * clause in `roles.deleteRule`. Its color and description stay editable.
 */
const nameLocked = computed(
    () => isEdit.value && isProtectedRole({ name: props.role.name }),
)

const nameRules = [required(t), maxLength(t, 50)]
const descriptionRules = [maxLength(t, 200)]

const hasChanges = computed(
    () =>
        draft.name !== original.name ||
        draft.description !== original.description ||
        draft.color !== original.color,
)

function isSelected(hex) {
    return toHex6(draft.color) === toHex6(hex)
}

function pickSwatch(hex) {
    draft.color = hex
    customOpen.value = false
}

function toggleCustom() {
    // v-color-picker has no concept of "no color" — handed an empty string it
    // has nothing to parse, so open it on a real value it can edit.
    if (!customOpen.value && !draft.color) draft.color = ROLE_COLORS[0]
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
        // Reopen on the swatch row unless the existing color is off-palette.
        customOpen.value =
            !!draft.color && !ROLE_COLORS.some((c) => isSelected(c))
        dialog.value = true
    },
    { immediate: true },
)

// Closing by backdrop/escape has to reach the parent too, or its `role` ref
// stays set and the dialog can never be reopened for the same record.
watch(dialog, (open) => {
    if (!open) emit('close')
})

function close() {
    dialog.value = false
}

async function save() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) return

    // `idx_roles_name` is unique; the picker sends whatever was typed and the
    // collision comes back as a 400 on the `name` field.
    const payload = {
        name: nameLocked.value ? props.role.name : draft.name.trim(),
        description: draft.description.trim(),
        color: toHex6(draft.color),
    }

    saving.value = true
    try {
        if (isEdit.value) {
            await pb.collection('roles').update(props.role.id, payload)
        } else {
            await pb.collection('roles').create(payload)
        }
        emit('saved', isEdit.value ? 'updated' : 'created')
        close()
    } catch (err) {
        if (err?.response?.data?.name) {
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
