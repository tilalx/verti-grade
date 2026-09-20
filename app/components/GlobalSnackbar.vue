<template>
    <v-snackbar
        v-model="visible"
        :color="color"
        location="top"
        timeout="6000"
        rounded="lg"
        data-testid="global-snackbar"
    >
        <div
            class="d-flex align-center ga-2"
            data-testid="global-snackbar-message"
        >
            <v-icon size="18">{{ icon }}</v-icon>
            {{ message }}
        </div>
    </v-snackbar>
</template>

<script setup lang="ts">
const { visible, color, message } = useNotification()

const icon = computed(
    () =>
        ({
            success: 'mdi-check-circle-outline',
            error: 'mdi-alert-circle-outline',
            info: 'mdi-information-outline',
            warning: 'mdi-alert-outline',
        })[color.value] ?? 'mdi-information-outline',
)
</script>
