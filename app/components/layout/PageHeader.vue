<script setup lang="ts">
defineProps<{
    title: string
    subtitle?: string
}>()
</script>

<template>
    <header
        class="page-header d-flex flex-column flex-sm-row align-sm-center justify-space-between ga-4 mb-4"
    >
        <div>
            <h1 class="page-header__title">{{ title }}</h1>
            <p v-if="subtitle" class="page-header__subtitle mb-0">
                {{ subtitle }}
            </p>
        </div>
        <div v-if="$slots.actions" class="d-flex align-center ga-2">
            <slot name="actions" />
        </div>
    </header>
</template>

<style scoped>
.page-header__title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: rgb(var(--v-theme-on-background));
}

.page-header__subtitle {
    font-size: 0.85rem;
    color: rgba(var(--v-theme-on-background), 0.5);
}

@media (max-width: 600px) {
    .page-header__title {
        font-size: 1.35rem;
    }
}
</style>
