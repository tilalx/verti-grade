<template>
    <v-main>
        <slot />
    </v-main>
    <GlobalSnackbar />
    <div v-if="hydrated" data-testid="page-hydrated" hidden />
</template>

<script setup lang="ts">
const hydrated = useHydrated()
</script>
