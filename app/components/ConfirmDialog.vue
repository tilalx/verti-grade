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
    <LayoutDialogShell
        v-model="open"
        :title="title"
        :max-width="maxWidth"
        data-testid="confirm-dialog"
    >
        <div class="text-body-2 text-medium-emphasis">{{ message }}</div>
        <template #actions>
            <v-btn
                variant="text"
                data-testid="confirm-dialog-cancel"
                @click="open = false"
            >
                {{ $t('actions.cancel') }}
            </v-btn>
            <v-spacer />
            <v-btn
                :color="confirmColor"
                :loading="loading"
                data-testid="confirm-dialog-confirm"
                @click="emit('confirm')"
            >
                {{ confirmText ?? $t('actions.delete') }}
            </v-btn>
        </template>
    </LayoutDialogShell>
</template>
