<template>
    <v-snackbar-queue
        v-model="queue"
        location="top"
        timeout="6000"
        rounded="lg"
        total-visible="3"
        data-testid="global-snackbar"
    >
        <template #text="{ item }">
            <div
                class="d-flex align-center ga-2"
                data-testid="global-snackbar-message"
                :data-color="item.color"
            >
                <v-icon size="18">{{ iconFor(item.color) }}</v-icon>
                {{ item.text }}
            </div>
        </template>
    </v-snackbar-queue>
</template>

<script setup lang="ts">
const { queue } = useNotification()

const icons: Record<string, string> = {
    success: 'mdi-check-circle-outline',
    error: 'mdi-alert-circle-outline',
    info: 'mdi-information-outline',
    warning: 'mdi-alert-outline',
}
const iconFor = (color?: string) => icons[color ?? ''] ?? icons.info
</script>
