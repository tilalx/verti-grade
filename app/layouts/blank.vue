<template>
    <main class="flex flex-1 flex-col">
        <slot />
    </main>
    <div v-if="hydrated" data-testid="page-hydrated" hidden />
</template>

<script setup lang="ts">
const hydrated = useHydrated()
</script>
