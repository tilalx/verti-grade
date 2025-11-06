<template>
    <v-dialog v-model="dialog" persistent max-width="600px">
        <v-card>
            <v-card-title>{{ $t('users.edit') }}</v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="valid" lazy-validation>
                    <v-text-field
                        v-model="editableUser.username"
                        :rules="usernameRules"
                        :label="$t('account.username')"
                        required
                    ></v-text-field>
                    <v-text-field
                        v-model="editableUser.firstname"
                        :rules="nameRules"
                        :label="$t('account.firstname')"
                        required
                    ></v-text-field>
                    <v-text-field
                        v-model="editableUser.name"
                        :rules="nameRules"
                        :label="$t('account.lastname')"
                        required
                    ></v-text-field>
                    <v-text-field
                        :value="editableUser.email"
                        :label="$t('account.email')"
                        disabled
                    ></v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="close">{{ $t('actions.cancel') }}</v-btn>
                <v-btn :disabled="!valid || !hasChanges" color="primary" @click="save">{{ $t('actions.save') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const pb = usePocketbase()
const emit = defineEmits(['user-updated', 'close'])
const props = defineProps({
    user: {
        type: Object,
        default: null,
    },
})

const dialog = ref(false)
const valid = ref(false)
const form = ref(null)
const editableUser = reactive({ id: '', username: '', firstname: '', name: '', email: '' })
const originalUser = reactive({ ...editableUser })

const nameRules = [v => !!v || t('validations.required')]
const usernameRules = [
    v => !!v || t('validations.required'),
    v => (v && v.length >= 3) || t('validations.minLength', { min: 3 }),
]

const hasChanges = computed(() => {
    return (
        editableUser.username !== originalUser.username ||
        editableUser.firstname !== originalUser.firstname ||
        editableUser.name !== originalUser.name
    )
})

watch(() => props.user, (newUser) => {
    if (newUser) {
        Object.assign(editableUser, {
            id: newUser.id,
            username: newUser.username,
            firstname: newUser.firstname || '',
            name: newUser.name || '',
            email: newUser.email,
        })
        Object.assign(originalUser, editableUser)
        dialog.value = true
    } else {
        dialog.value = false
    }
})

function close() {
    dialog.value = false
    emit('close')
}

async function save() {
    const { valid: formValid } = await form.value.validate()
    if (!formValid) return

    try {
        const data = {
            username: editableUser.username,
            firstname: editableUser.firstname,
            name: editableUser.name,
        }
        await pb.collection('users').update(editableUser.id, data)
        emit('user-updated')
        close()
    } catch (error) {
        console.error('Failed to update user:', error)
    }
}
</script>