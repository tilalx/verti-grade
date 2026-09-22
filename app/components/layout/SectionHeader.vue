<script setup lang="ts">
defineProps<{
    title: string
    subtitle?: string
}>()
</script>

<template>
    <header
        class="section-header d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-3 mb-4"
    >
        <div>
            <h2 class="section-header__title">{{ title }}</h2>
            <p v-if="subtitle" class="section-header__subtitle mb-0">
                {{ subtitle }}
            </p>
        </div>
        <div v-if="$slots.actions" class="d-flex align-center ga-2">
            <slot name="actions" />
        </div>
    </header>
</template>

<style scoped>
.section-header__title {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: rgb(var(--v-theme-on-background));
}

.section-header__subtitle {
    font-size: 0.85rem;
    color: rgba(var(--v-theme-on-background), 0.5);
}
</style>
