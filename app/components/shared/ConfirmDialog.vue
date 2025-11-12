<template>
    <v-dialog v-model="dialog" :max-width="options.width" @keydown.esc="cancel">
        <v-card>
            <v-toolbar :color="options.color" dense>
                <v-toolbar-title>{{ title }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text v-show="!!message" class="pa-4">{{ message }}</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="cancel">{{ $t('actions.cancel') }}</v-btn>
                <v-btn :color="options.color" @click="agree">{{ $t('actions.confirm') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const dialog = ref(false)
const resolve = ref(null)
const reject = ref(null)
const message = ref('')
const title = ref('')
const options = ref({
    color: 'primary',
    width: 400,
})

// The 'open' method returns a Promise that resolves or rejects based on user action
function open(newTitle, newMessage, newOptions) {
    dialog.value = true
    title.value = newTitle
    message.value = newMessage
    options.value = { ...options.value, ...newOptions }
    return new Promise((res, rej) => {
        resolve.value = res
        reject.value = rej
    })
}

function agree() {
    resolve.value(true)
    dialog.value = false
}

function cancel() {
    resolve.value(false)
    dialog.value = false
}

// Expose the open function to be used via a ref
defineExpose({ open })
</script>