<template>
    <v-snackbar
        v-model="visible"
        :color="color"
        location="top"
        timeout="4000"
        rounded="lg"
    >
        <div class="d-flex align-center ga-2">
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
