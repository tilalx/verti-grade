<script setup lang="ts">
const { mdAndUp } = useDisplay()
</script>

<template>
    <v-alert
        v-if="!mdAndUp"
        type="info"
        variant="tonal"
        data-testid="desktop-hint"
    >
        <slot>{{ $t('nav.desktopHint') }}</slot>
    </v-alert>
</template>
