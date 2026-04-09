<script setup lang="ts">
const open = defineModel<boolean>({ default: false })

withDefaults(
    defineProps<{
        title?: string
        message?: string
        confirmText?: string
        confirmColor?: string
        loading?: boolean
        maxWidth?: string | number
    }>(),
    {
        confirmColor: 'error',
        maxWidth: 420,
    },
)

const emit = defineEmits<{ confirm: [] }>()
</script>

<template>
    <v-dialog v-model="open" :max-width="maxWidth">
        <v-card rounded="xl">
            <v-card-title
                v-if="title"
                class="pa-5 pb-2 text-body-1 font-weight-semibold"
            >
                {{ title }}
            </v-card-title>
            <v-card-text
                class="text-body-2 text-medium-emphasis"
                :class="title ? 'pa-5 pt-0' : 'pa-5'"
            >
                {{ message }}
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
                <v-btn variant="text" @click="open = false">
                    {{ $t('actions.cancel') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    :color="confirmColor"
                    variant="flat"
                    :loading="loading"
                    @click="emit('confirm')"
                >
                    {{ confirmText ?? $t('actions.delete') }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
