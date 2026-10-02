<template>
    <div class="save-bar">
        <Transition name="save-bar">
            <div
                v-if="show"
                class="save-bar__inner flex items-center justify-between gap-3 rounded-lg bg-default px-4 py-2 shadow-lg ring ring-default"
            >
                <span
                    class="flex items-center gap-2 text-sm text-muted"
                    :data-testid="`${testIdPrefix}-unsaved`"
                >
                    <UIcon
                        name="i-lucide-circle-dot"
                        class="size-4 text-warning"
                    />
                    {{ $t('account.unsavedChanges') }}
                </span>
                <div class="flex items-center gap-2">
                    <UButton
                        v-if="cancelable"
                        color="neutral"
                        variant="ghost"
                        :data-testid="`${testIdPrefix}-cancel`"
                        @click="emit('cancel')"
                    >
                        {{ $t('actions.cancel') }}
                    </UButton>
                    <UButton
                        color="primary"
                        :loading="loading"
                        :disabled="disabled"
                        icon="i-lucide-save"
                        :data-testid="`${testIdPrefix}-save`"
                        @click="emit('save')"
                    >
                        {{ $t('actions.save') }}
                    </UButton>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    show: boolean
    testIdPrefix: string
    loading?: boolean
    disabled?: boolean
    cancelable?: boolean
}>()

const emit = defineEmits<{ save: []; cancel: [] }>()
</script>

<style scoped>
@reference "~/assets/css/main.css";

.save-bar {
    position: fixed;
    right: 16px;
    bottom: calc(var(--app-bottom) + var(--app-bottom-inset, 0px) + 12px);
    left: 16px;
    z-index: 20;
}

.save-bar-enter-active,
.save-bar-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

.save-bar-enter-from,
.save-bar-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

@variant lg {
    .save-bar {
        position: sticky;
        top: calc(var(--app-top) + var(--app-top-inset, 0px) + 12px);
        right: auto;
        bottom: auto;
        left: auto;
        display: flex;
        justify-content: flex-end;
        height: 0;
        overflow: visible;
    }

    .save-bar__inner {
        margin-top: 12px;
        margin-right: 12px;
        height: fit-content;
    }
}
</style>
